import OpenAI from 'openai'
import { setTracingDisabled } from '@openai/agents'
import { ChatCompletionMessageParam, ChatCompletionFunctionTool } from 'openai/resources/chat/completions/completions'

setTracingDisabled(true)

export const AVAILABLE_MODELS = [
  'deepseek-v4-pro-global',
  'gpt-6-1-sol-dz-eu',
  'gpt-6-astra-global',
  'gpt-6-luna-dz-eu',
  'grok-4-7-global',
  'kimi-k2-7-code-global',
  'mai-image-2-5-global',
  'mai-thinking-1-global'
] as const
export type AvailableModel = (typeof AVAILABLE_MODELS)[number]

export type OpenAIToolExtended = ChatCompletionFunctionTool & { nativeFunction: (args: any) => Promise<string> }

const MAX_TOOL_ROUNDS = 5
const MAX_TOOL_CALLS = 20

export class Agent {
  client: OpenAI
  history: ChatCompletionMessageParam[] = []
  tools: OpenAIToolExtended[] = []
  model: AvailableModel

  constructor(
    options: Partial<{
      history: ChatCompletionMessageParam[],
      tools: OpenAIToolExtended[],
      model: AvailableModel,
    }> = {}
  ) {
    this.model = options.model ?? 'gpt-6-1-sol-dz-eu'
    this.history = options.history ?? []
    this.tools = options.tools ?? []

    this.client = new OpenAI({
      baseURL: process.env['OPENAI_BASE_URL'],
      apiKey: 'unused',
      defaultHeaders: {
        'api-key': process.env['OPENAI_API_KEY']
      }
    })
  }

  async ask(question: string) {
    console.log('[[VERBOSE]]:', question)
    const newMessages: ChatCompletionMessageParam[] = [{ role: 'user', content: question }]
    let toolCalls = 0

    // Allow a final answer request after the last permitted tool round.
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const result = await this.client.chat.completions.create({
        model: this.model,
        messages: [...this.history, ...newMessages],
        ...(this.tools.length ? { tool_choice: 'auto', tools: this.tools } : {})
      })
      const choice = result.choices[0]
      if (!choice)
        throw new Error('No choice returned from the model')

      const message = choice.message
      newMessages.push(message)

      if (!message.tool_calls?.length) { // no tool calls, final answer
        if (choice.finish_reason !== 'stop' || !message.content?.trim())
          throw new Error('The model did not return a complete answer')

        this.history.push(...newMessages)
        return newMessages
      }

      if (choice.finish_reason !== 'tool_calls')
        throw new Error('The model did not return a complete tool request')
      if (round === MAX_TOOL_ROUNDS)
        throw new Error(`Agent exceeded the limit of ${MAX_TOOL_ROUNDS} tool rounds`)
      if ((toolCalls += message.tool_calls.length) > MAX_TOOL_CALLS)
        throw new Error(`Agent exceeded the limit of ${MAX_TOOL_CALLS} tool calls`)

      for (const toolCall of message.tool_calls) {
        if (toolCall.type !== 'function')
          throw new Error(`Unsupported tool call type: ${toolCall.type}`)

        const fn = this.tools.find(t => t.type === 'function' && t.function.name === toolCall.function.name)
        if (!fn || fn.type !== 'function')
          throw new Error(`Function ${toolCall.function.name} not found among registered tools.`)

        const result = await fn.nativeFunction(JSON.parse(toolCall.function.arguments))
        newMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        })
      }

    }

    throw new Error('Agent exhausted its model request budget')
  }
}
