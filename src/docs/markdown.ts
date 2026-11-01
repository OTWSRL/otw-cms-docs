import type { Element, ElementContent, Root } from 'hast'
import { toString } from 'hast-util-to-string'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { createHighlighter, type Highlighter } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

export interface Heading {
  depth: 2 | 3
  id: string
  text: string
}

/** A fenced block with a `filename="…"` meta: a whole file, which the samples test compiles. */
export interface CodeFile {
  lang: string
  filename: string
  code: string
}

export interface RenderedMarkdown {
  html: string
  headings: Heading[]
  files: CodeFile[]
}

/** Turns an inline code name, such as `commerce.order.paid`, into its Code Reference URL. */
export type ReferenceLinker = (name: string) => string | undefined

const LANGS = [
  'ts',
  'tsx',
  'js',
  'json',
  'bash',
  'yaml',
  'css',
  'diff',
  'dotenv',
  'dockerfile',
  'sql',
]
const ALIASES: Record<string, string> = { sh: 'bash', shell: 'bash', env: 'dotenv', text: 'txt' }
const THEME = 'github-light'

let highlighter: Promise<Highlighter> | undefined
function getHighlighter(): Promise<Highlighter> {
  // The JavaScript engine needs no WebAssembly, so it works wherever Next.js renders.
  highlighter ??= createHighlighter({
    themes: [THEME],
    langs: LANGS,
    engine: createJavaScriptRegexEngine(),
  })
  return highlighter
}

/** `filename="src/index.ts"` and other `key="value"` pairs after the language. */
export function parseMeta(meta: string | undefined): Record<string, string> {
  const pairs: Record<string, string> = {}
  for (const match of (meta ?? '').matchAll(/(\w+)="([^"]*)"/g)) pairs[match[1]!] = match[2]!
  return pairs
}

const CALLOUTS: Record<string, string> = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Warning',
}

function hasClass(node: Element, name: string): boolean {
  const value = node.properties.className
  return Array.isArray(value) && value.includes(name)
}

/** GitHub's `> [!NOTE]` blockquotes become WordPress-style notices. */
function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'blockquote') return
      const paragraph = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'p',
      )
      const first = paragraph?.children[0]
      const match = first?.type === 'text' ? /^\[!(\w+)\]\s*/.exec(first.value) : null
      const title = match && CALLOUTS[match[1]!]
      if (!paragraph || !first || first.type !== 'text' || !match || !title) return
      first.value = first.value.slice(match[0].length)
      if (!first.value) paragraph.children.shift()
      if (paragraph.children[0]?.type === 'element' && paragraph.children[0].tagName === 'br') {
        paragraph.children.shift()
      }
      node.tagName = 'aside'
      node.properties = { className: ['callout', `callout-${match[1]!.toLowerCase()}`] }
      node.children.unshift({
        type: 'element',
        tagName: 'p',
        properties: { className: ['callout-title'] },
        children: [{ type: 'text', value: title }],
      })
    })
  }
}

/** Highlights fenced code, and captions whole files with their name. */
function rehypeCode(files: CodeFile[]) {
  return async (tree: Root) => {
    const shiki = await getHighlighter()
    const loaded = new Set(shiki.getLoadedLanguages())
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || index === undefined || !parent) return
      const code = node.children[0]
      if (!code || code.type !== 'element' || code.tagName !== 'code') return
      const className = (code.properties.className as string[] | undefined) ?? []
      const declared = className.find((name) => name.startsWith('language-'))?.slice(9) ?? 'txt'
      const lang = ALIASES[declared] ?? declared
      const text = toString(code).replace(/\n$/, '')
      const { filename } = parseMeta((code.data as { meta?: string } | undefined)?.meta)
      if (filename) files.push({ lang, filename, code: text })

      const highlighted = shiki.codeToHast(text, {
        lang: loaded.has(lang) ? lang : 'txt',
        theme: THEME,
      })
      const pre = highlighted.children[0] as Element
      pre.properties.tabIndex = 0
      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-block'], dataLang: lang },
        children: [
          ...(filename
            ? [
                {
                  type: 'element',
                  tagName: 'figcaption',
                  properties: {},
                  children: [{ type: 'text', value: filename }],
                } satisfies Element,
              ]
            : []),
          pre,
        ],
      }
      parent.children[index] = figure
      return SKIP
    })
  }
}

/** Links inline code that names something in the Code Reference, as WordPress's handbooks do. */
function rehypeReferenceLinks(link: ReferenceLinker | undefined) {
  return (tree: Root) => {
    if (!link) return
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'pre' || node.tagName === 'a' || hasClass(node, 'code-block'))
        return SKIP
      if (node.tagName !== 'code' || index === undefined || !parent) return
      const href = link(toString(node).replace(/\(\)$/, ''))
      if (!href) return
      parent.children[index] = {
        type: 'element',
        tagName: 'a',
        properties: { href, className: ['reference-link'] },
        children: [node],
      }
      return SKIP
    })
  }
}

/** Collects the table of contents, and gives each heading a link to itself. */
function rehypeHeadings(headings: Heading[]) {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return
      const id = String(node.properties.id ?? '')
      if (!id) return
      headings.push({ depth: node.tagName === 'h2' ? 2 : 3, id, text: toString(node) })
      const anchor: ElementContent = {
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['heading-anchor'],
          href: `#${id}`,
          ariaHidden: 'true',
          tabIndex: -1,
        },
        children: [{ type: 'text', value: '#' }],
      }
      node.children.push(anchor)
    })
  }
}

/** Marks links that leave the site, so they open with a hint for screen readers. */
function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      const href = node.tagName === 'a' ? String(node.properties.href ?? '') : ''
      if (/^https?:\/\//.test(href)) node.properties.rel = ['noopener', 'noreferrer']
    })
  }
}

/**
 * Markdown to HTML. Raw HTML in the source is dropped rather than passed through, so everything
 * on the page is escaped by the serializer.
 */
export async function renderMarkdown(
  markdown: string,
  { link }: { link?: ReferenceLinker } = {},
): Promise<RenderedMarkdown> {
  const headings: Heading[] = []
  const files: CodeFile[] = []
  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCallouts)
    .use(rehypeCode, files)
    .use(rehypeReferenceLinks, link)
    .use(rehypeHeadings, headings)
    .use(rehypeExternalLinks)
    .use(rehypeStringify)
    .process(markdown)
  return { html: String(html), headings, files }
}

/** Highlights one snippet outside a Markdown page, such as a signature on a reference page. */
export async function highlight(code: string, lang = 'ts'): Promise<string> {
  const shiki = await getHighlighter()
  return shiki.codeToHtml(code, { lang, theme: THEME })
}
