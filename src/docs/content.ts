import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { parse } from 'yaml'

/** The handbooks, as wordpress.org splits them: using the CMS, plugins, themes, and hosting. */
export const HANDBOOK_IDS = ['documentation', 'plugins', 'themes', 'hosting'] as const
export type HandbookId = (typeof HANDBOOK_IDS)[number]

export const CONTENT_DIR = join(process.cwd(), 'content')

export interface DocPage {
  handbook: HandbookId
  /** Path segments under the handbook; empty for its front page. */
  slug: string[]
  url: string
  title: string
  description: string
  /** Position among its siblings; lower comes first, then by title. */
  order: number
  /** Relative to content/, for messages. */
  file: string
  /** The Markdown after the front matter. */
  body: string
}

export interface NavItem {
  title: string
  url: string
  children: NavItem[]
}

export interface Handbook {
  id: HandbookId
  title: string
  description: string
  url: string
  /** Every page, in reading order: the front page, then each chapter depth-first. */
  pages: DocPage[]
  /** The chapters and their pages, without the front page. */
  nav: NavItem[]
}

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n?/

/** Splits a page into its front matter (title, description, order) and its Markdown. */
export function parsePage(
  source: string,
  file: string,
): Pick<DocPage, 'title' | 'description' | 'order' | 'body'> {
  const match = FRONT_MATTER.exec(source.replace(/\r\n/g, '\n'))
  if (!match) throw new Error(`${file}: starts without front matter (--- title: … ---)`)
  const data = (parse(match[1]!) ?? {}) as Record<string, unknown>
  const { title, description, order = 100 } = data
  if (typeof title !== 'string' || !title.trim()) throw new Error(`${file}: needs a title`)
  if (typeof description !== 'string' || !description.trim()) {
    throw new Error(`${file}: needs a description, shown under the title and in search`)
  }
  if (typeof order !== 'number') throw new Error(`${file}: order must be a number`)
  return { title, description, order, body: source.slice(match[0].length) }
}

async function markdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(entry.parentPath, entry.name))
}

function slugOf(path: string): string[] {
  const parts = path.replace(/\.md$/, '').split(sep)
  return parts.at(-1) === 'index' ? parts.slice(0, -1) : parts
}

const byOrder = (a: DocPage, b: DocPage) => a.order - b.order || a.title.localeCompare(b.title)

async function loadHandbook(id: HandbookId, contentDir: string): Promise<Handbook> {
  const dir = join(contentDir, id)
  const pages: DocPage[] = []
  for (const path of await markdownFiles(dir)) {
    const file = relative(contentDir, path).split(sep).join('/')
    const slug = slugOf(relative(dir, path))
    const page = parsePage(await readFile(path, 'utf8'), file)
    pages.push({ handbook: id, slug, url: ['', id, ...slug].join('/'), file, ...page })
  }
  const front = pages.find((page) => page.slug.length === 0)
  if (!front) throw new Error(`content/${id}: needs an index.md, the handbook's front page`)

  // A chapter is a folder; its index.md is the chapter's page, and the rest sit under it.
  const childrenOf = (slug: string[]) =>
    pages
      .filter(
        (page) =>
          page.slug.length === slug.length + 1 && slug.every((part, i) => page.slug[i] === part),
      )
      .sort(byOrder)
  const ordered: DocPage[] = [front]
  const navOf = (slug: string[]): NavItem[] =>
    childrenOf(slug).map((page) => {
      ordered.push(page)
      return { title: page.title, url: page.url, children: navOf(page.slug) }
    })
  const nav = navOf([])
  const orphan = pages.find((page) => !ordered.includes(page))
  if (orphan)
    throw new Error(
      `${orphan.file}: its folder has no index.md, so it has no place in the handbook`,
    )

  return {
    id,
    title: front.title,
    description: front.description,
    url: front.url,
    pages: ordered,
    nav,
  }
}

let cached: Promise<Handbook[]> | undefined

/** Every handbook. Read once in production; on every call in development, so edits show. */
export function loadHandbooks(contentDir = CONTENT_DIR): Promise<Handbook[]> {
  if (process.env.NODE_ENV !== 'production' || contentDir !== CONTENT_DIR) {
    return Promise.all(HANDBOOK_IDS.map((id) => loadHandbook(id, contentDir)))
  }
  cached ??= Promise.all(HANDBOOK_IDS.map((id) => loadHandbook(id, contentDir)))
  return cached
}

export async function getHandbook(id: HandbookId): Promise<Handbook> {
  const handbook = (await loadHandbooks()).find((candidate) => candidate.id === id)
  if (!handbook) throw new Error(`No handbook "${id}"`)
  return handbook
}

/** The page at a handbook path, with the pages before and after it in reading order. */
export async function findPage(
  id: HandbookId,
  slug: readonly string[] = [],
): Promise<{ handbook: Handbook; page: DocPage; previous?: DocPage; next?: DocPage } | null> {
  const handbook = await getHandbook(id)
  const index = handbook.pages.findIndex((page) => page.slug.join('/') === slug.join('/'))
  if (index < 0) return null
  return {
    handbook,
    page: handbook.pages[index]!,
    previous: handbook.pages[index - 1],
    next: handbook.pages[index + 1],
  }
}

/** The pages from the handbook's front page down to this one, for breadcrumbs. */
export function trail(handbook: Handbook, page: DocPage): DocPage[] {
  return handbook.pages
    .filter(
      (candidate) =>
        candidate.slug.length <= page.slug.length &&
        candidate.slug.every((part, i) => page.slug[i] === part),
    )
    .sort((a, b) => a.slug.length - b.slug.length)
}
