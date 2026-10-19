import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ChatCompletion, ChatCompletionMessage } from 'openai/resources/chat/completions/completions'
import { Agent, type OpenAIToolExtended } from './ai'

function completion(message: ChatCompletionMessage, finishReason: ChatCompletion.Choice['finish_reason']): ChatCompletion {
  return {
    id: 'test',
    object: 'chat.completion',
    created: 0,
    model: 'test',
    choices: [{ index: 0, message, finish_reason: finishReason, logprobs: null }]
  }
}

function toolRequest(count = 1): ChatCompletion {
  return completion({
    role: 'assistant',
    content: null,
    refusal: null,
    tool_calls: Array.from({ length: count }, (_, index) => ({
      id: `call-${index}`,
      type: 'function',
      function: { name: 'read_documentation', arguments: '{"topic":"example.md"}' }
    }))
  }, 'tool_calls')
}

const answer = completion({ role: 'assistant', content: 'Supported answer', refusal: null }, 'stop')

function documentationTool(read: () => Promise<string>): OpenAIToolExtended {
  return {
    type: 'function',
    function: {
      name: 'read_documentation',
      parameters: { type: 'object', properties: { topic: { type: 'string' } } }
    },
    nativeFunction: read
  }
}

test('returns a direct answer and preserves existing history', async t => {
  const agent = new Agent({ history: [{ role: 'system', content: 'Instructions' }] })
  const create = t.mock.method(agent.client.chat.completions, 'create', async () => answer)

  const messages = await agent.ask('Question')

  assert.equal(create.mock.callCount(), 1)
  assert.deepEqual(messages.map(message => message.role), ['user', 'assistant'])
  assert.equal(agent.history.length, 3)
})

test('executes multiple tool rounds before committing a final answer', async t => {
  const read = t.mock.fn(async () => 'Document content')
  const agent = new Agent({ tools: [documentationTool(read)] })
  let calls = 0
  const create = t.mock.method(agent.client.chat.completions, 'create', async () =>
    ++calls <= 2 ? toolRequest() : answer
  )

  const messages = await agent.ask('Question')

  assert.equal(create.mock.callCount(), 3)
  assert.equal(read.mock.callCount(), 2)
  assert.deepEqual(messages.map(message => message.role), [
    'user', 'assistant', 'tool', 'assistant', 'tool', 'assistant'
  ])
  assert.deepEqual(agent.history, messages)
})

test('allows a final answer after five tool rounds and twenty tool calls', async t => {
  const read = t.mock.fn(async () => 'Document content')
  const agent = new Agent({ tools: [documentationTool(read)] })
  let calls = 0
  t.mock.method(agent.client.chat.completions, 'create', async () =>
    ++calls <= 5 ? toolRequest(4) : answer
  )

  await agent.ask('Question')

  assert.equal(calls, 6)
  assert.equal(read.mock.callCount(), 20)
  assert.equal(agent.history.at(-1)?.content, 'Supported answer')
})

test('stops repeated tool rounds without committing partial history', async t => {
  const read = t.mock.fn(async () => 'Document content')
  const agent = new Agent({ tools: [documentationTool(read)] })
  const create = t.mock.method(agent.client.chat.completions, 'create', async () => toolRequest())

  await assert.rejects(agent.ask('Question'), /limit of 5 tool rounds/)

  assert.equal(create.mock.callCount(), 6)
  assert.equal(read.mock.callCount(), 5)
  assert.deepEqual(agent.history, [])
})

test('rejects an over-budget batch before executing any tools', async t => {
  const read = t.mock.fn(async () => 'Document content')
  const agent = new Agent({ tools: [documentationTool(read)] })
  t.mock.method(agent.client.chat.completions, 'create', async () => toolRequest(21))

  await assert.rejects(agent.ask('Question'), /limit of 20 tool calls/)

  assert.equal(read.mock.callCount(), 0)
  assert.deepEqual(agent.history, [])
})

test('propagates tool failures without committing partial history', async t => {
  const agent = new Agent({
    tools: [documentationTool(async () => { throw new Error('Read failed') })]
  })
  t.mock.method(agent.client.chat.completions, 'create', async () => toolRequest())

  await assert.rejects(agent.ask('Question'), /Read failed/)
  assert.deepEqual(agent.history, [])
})

test('rejects missing, empty, and truncated answers', async t => {
  const empty = completion({ role: 'assistant', content: '', refusal: null }, 'stop')
  const truncated = completion({ role: 'assistant', content: 'Partial', refusal: null }, 'length')
  for (const response of [{ ...answer, choices: [] }, empty, truncated]) {
    const agent = new Agent()
    t.mock.method(agent.client.chat.completions, 'create', async () => response)

    await assert.rejects(agent.ask('Question'), /No choice|complete answer/)
    assert.deepEqual(agent.history, [])
  }
})
