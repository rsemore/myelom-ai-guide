import { Agent, OpenAIToolExtended } from '@/lib/ai'
import { ReadDocumentationTool } from '@/services/knowledge'

async function main() {
	const agent = new Agent({
		model: 'deepseek-v4-pro-global',
		history: [
			{
				role: 'system',
				content: `You are a helpful assistant and ONLY using the files provided to you in Markdown files. When responding, do not use any external information and reply with the filename you took it from. 

You have these following files available to use with the ReadDocumentationTool:

- horses.md
- cats.md
- cdwifi.md`
			}
		],
		tools: [
			ReadDocumentationTool
		]
	})
	const response = await agent.ask('How do I access the cdwifi portal?')


	console.log(agent.history)
	console.log(JSON.stringify(agent.history, null, 4))

	return response
}

main()
	.then(console.log)
	.catch(console.error)
