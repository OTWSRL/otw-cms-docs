import { loadHandbooks } from './content'
import { documentedPackages, extensionUrl, kindInfo, reference, symbolUrl } from './reference'

/** Something search can find: a handbook page, or an entry in the Code Reference. */
export interface SearchDoc {
  title: string
  url: string
  /** Where it lives, such as "Plugin Handbook" or "Code Reference · Action". */
  section: string
  description: string
  headings: string[]
  text: string
}

export interface SearchResult {
  title: string
  url: string
  section: string
  snippet: string
}

const MAX_RESULTS = 50
const SNIPPET = 180

/** Markdown to plain text, near enough for matching and snippets. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/^```.*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[`*_|]/g, '')
    .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING)\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function terms(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length >= 2),
    ),
  ].slice(0, 8)
}

function count(haystack: string, needle: string): number {
  let found = 0
  for (
    let at = haystack.indexOf(needle);
    at >= 0 && found < 20;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    found++
  }
  return found
}

function snippet(doc: SearchDoc, words: string[]): string {
  const text = doc.text || doc.description
  const lower = text.toLowerCase()
  const at = Math.min(...words.map((word) => lower.indexOf(word)).filter((i) => i >= 0), Infinity)
  if (!Number.isFinite(at) || at < SNIPPET / 2) {
    return doc.description || text.slice(0, SNIPPET)
  }
  const start = text.lastIndexOf(' ', at - SNIPPET / 3) + 1
  const end = text.indexOf(' ', start + SNIPPET)
  return `…${text.slice(start, end < 0 ? undefined : end)}…`
}

/**
 * Every term must appear somewhere; a match in the title counts for most, then headings and the
 * description, then the body. An entry named exactly what was typed comes first.
 */
export function search(query: string, docs: readonly SearchDoc[]): SearchResult[] {
  const words = terms(query)
  if (words.length === 0) return []
  const exact = query.trim().toLowerCase()
  const scored: { doc: SearchDoc; score: number }[] = []
  for (const doc of docs) {
    const title = doc.title.toLowerCase()
    const headings = doc.headings.join(' ').toLowerCase()
    const description = doc.description.toLowerCase()
    const text = doc.text.toLowerCase()
    let score = title === exact ? 100 : 0
    let matched = true
    for (const word of words) {
      const points =
        (title.includes(word) ? 10 : 0) +
        (headings.includes(word) ? 4 : 0) +
        (description.includes(word) ? 3 : 0) +
        Math.min(count(text, word), 10)
      if (points === 0) {
        matched = false
        break
      }
      score += points
    }
    if (matched) scored.push({ doc, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, MAX_RESULTS)
    .map(({ doc }) => ({
      title: doc.title,
      url: doc.url,
      section: doc.section,
      snippet: snippet(doc, words),
    }))
}

/** The handbooks' pages and the Code Reference's entries, ready to search. */
export async function searchDocs(): Promise<SearchDoc[]> {
  const docs: SearchDoc[] = []
  for (const handbook of await loadHandbooks()) {
    for (const page of handbook.pages) {
      docs.push({
        title: page.title,
        url: page.url,
        section: handbook.title,
        description: page.description,
        headings: [...page.body.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1]!),
        text: plainText(page.body),
      })
    }
  }
  for (const point of reference.extensions) {
    docs.push({
      title: point.name,
      url: extensionUrl(point),
      section: `Code Reference · ${kindInfo(point.kind).singular}`,
      description: point.description,
      headings: [],
      text: point.type,
    })
  }
  for (const pkg of documentedPackages()) {
    for (const symbol of pkg.symbols) {
      docs.push({
        title: symbol.name,
        url: symbolUrl(pkg, symbol),
        section: `Code Reference · ${symbol.entry}`,
        description: symbol.description,
        headings: symbol.members.map((member) => member.name),
        text: symbol.signature,
      })
    }
  }
  for (const command of reference.cli.commands) {
    docs.push({
      title: `cms ${command.name}`,
      url: `/reference/cli#${command.name}`,
      section: 'Code Reference · CLI',
      description: command.description,
      headings: command.flags.map((flag) => flag.flag),
      text: command.flags.map((flag) => `${flag.flag} ${flag.description}`).join(' '),
    })
  }
  return docs
}
