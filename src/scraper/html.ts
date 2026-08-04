import { parseHTML } from 'linkedom'

function normalizeParagraph(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export function extractArticleParagraphs(html: string, contentSelector: string): string[] {
  const { document } = parseHTML(html)
  const content = document.querySelector(contentSelector)
  if (!content) {
    throw new Error(`Could not find chapter content with selector "${contentSelector}".`)
  }

  const paragraphs = Array.from(content.querySelectorAll('p'))
    .map((paragraph) => normalizeParagraph(paragraph.textContent))
    .filter(Boolean)

  if (paragraphs.length > 0) return paragraphs

  for (const lineBreak of content.querySelectorAll('br')) {
    lineBreak.replaceWith(document.createTextNode('\n'))
  }
  const fallback = (content.textContent ?? '')
    .split(/\r?\n/)
    .map(normalizeParagraph)
    .filter(Boolean)
  if (fallback.length === 0) throw new Error('The chapter content did not contain readable text.')
  return fallback
}