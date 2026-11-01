import { beforeAll, describe, expect, it } from 'vitest'
import { loadHandbooks } from '@/docs/content'
import { renderMarkdown } from '@/docs/markdown'
import {
  documentedPackages,
  extensionUrl,
  KINDS,
  packageUrl,
  reference,
  referenceLinker,
  symbolUrl,
} from '@/docs/reference'

/** Every page the site serves, with the ids a link can jump to on it. */
async function sitePages(): Promise<Map<string, Set<string>>> {
  const pages = new Map<string, Set<string>>()
  const add = (url: string, ids: Iterable<string> = []) => pages.set(url, new Set(ids))
  add('/')
  add('/search')
  add('/reference')
  add('/reference/cli', reference.cli.commands.map((command) => command.name).concat('help'))
  for (const info of KINDS) add(`/reference/${info.path}`)
  for (const point of reference.extensions) add(extensionUrl(point))
  for (const pkg of documentedPackages()) {
    add(packageUrl(pkg))
    for (const symbol of pkg.symbols) add(symbolUrl(pkg, symbol))
  }
  return pages
}

describe('links in the handbooks', () => {
  const rendered = new Map<string, { file: string; html: string }>()
  let pages: Map<string, Set<string>>

  beforeAll(async () => {
    pages = await sitePages()
    const link = referenceLinker()
    for (const handbook of await loadHandbooks()) {
      for (const page of handbook.pages) {
        const { html } = await renderMarkdown(page.body, { link })
        rendered.set(page.url, { file: page.file, html })
        pages.set(page.url, new Set([...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]!)))
      }
    }
  })

  it('point at pages and headings that exist', () => {
    const broken: string[] = []
    for (const [url, { file, html }] of rendered) {
      for (const [, href] of html.matchAll(/ href="([^"]*)"/g)) {
        if (/^(https?:|mailto:)/.test(href!)) continue
        const [path, anchor] = href!.split('#') as [string, string | undefined]
        const target = path === '' ? url : path
        if (!target.startsWith('/')) {
          broken.push(`${file}: ${href} (use a path from the site root)`)
        } else if (!pages.has(target)) {
          broken.push(`${file}: ${href} (no such page)`)
        } else if (anchor && !pages.get(target)!.has(decodeURIComponent(anchor))) {
          broken.push(`${file}: ${href} (no such heading)`)
        }
      }
    }
    expect(broken).toEqual([])
  })
})
