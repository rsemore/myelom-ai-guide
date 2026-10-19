import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

import { NodeHtmlMarkdown } from 'node-html-markdown'

const FETCH_TIMEOUT_MS = 30_000
const USER_AGENT = 'Mozilla/5.0 (compatible; hello don\'t mind me www/1.0)'

function extractMarkdownFromHtml(htmlBody: string, rootUrl: string): string | null {
  const dom = new JSDOM(htmlBody, { url: rootUrl })
  try {
    const article = new Readability(dom.window.document).parse()
    if (!article?.content)
      return null

    const body = NodeHtmlMarkdown.translate(article.content).trim()
      .replace(/\*\*\s*\n(?=[A-Z])/g, '**\n\n') // certain pages have **heading**\s\nSetence, so we split it
    return article.title ? `# ${article.title}\n\n${body}` : body
  } finally {
    dom.window.close()
  }
}

export async function fetchWebsiteAsMarkdown(input: string): Promise<string | null> {
  const url = new URL(input)
  const response = await fetch(input, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' }
  })
  if (!response.ok)
    throw new Error(`Failed to fetch ${input}: HTTP ${response.status} (${response.statusText})`)

  const html = await response.text()

  return extractMarkdownFromHtml(html, url.href)
}
