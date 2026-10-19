import { OpenAIToolExtended } from '@/lib/ai'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const DOCUMENTS_AVAILABLE: string[] = readdirSync(
  process.env.KNOWLEDGE_BASE_PATH!,
  { withFileTypes: true }
).reduce((acc, val) => {
  if (!val.isFile() || !val.name.toLowerCase().endsWith('.md'))
    return acc

  acc.push(val.name)
  return acc
}, [] as string[])
export const DOCUMENTS_AVAILABLE_SET: Set<string> = new Set(DOCUMENTS_AVAILABLE)

export const ReadDocumentationTool: OpenAIToolExtended = {
  type: 'function',
  function: {
    name: 'read_documentation',
    description: 'Fetches a Markdown document relative to the specified topic.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to read documentation for.'
        }
      },
      required: ['topic']
    }
  },
  nativeFunction: async (args: { topic: string }) => {
    const { topic } = args

    console.log('--> TOOL REQUEST', args)

    const filePath = join(process.env.KNOWLEDGE_BASE_PATH!, topic.endsWith('.md') ? topic : `${topic}.md`)
    try {
      const content = await readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.log('ERROR!!', error)
      return 'Something went wrong while reading the documentation, apologies.'
    }
  }
}
