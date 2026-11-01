import Link from 'next/link'
import { highlight, renderMarkdown } from './markdown'
import { documentedPackages, KINDS, packageSlug, packageUrl, referenceLinker } from './reference'
import type { SourceLocation, TypeDefinition } from './reference-types'
import { Prose } from './ui/chrome'

/** The Code Reference's sections, beside every reference page. */
export function ReferenceNav({ current }: { current: string }) {
  const item = (url: string, label: string) => (
    <li key={url}>
      <Link href={url} aria-current={current === url ? 'page' : undefined}>
        {label}
      </Link>
    </li>
  )
  return (
    <div className="handbook-nav">
      <p className="handbook-nav-title">
        <Link href="/reference" aria-current={current === '/reference' ? 'page' : undefined}>
          Code Reference
        </Link>
      </p>
      <ul>
        <li>
          <span className="nav-group">Extension points</span>
          <ul>{KINDS.map((info) => item(`/reference/${info.path}`, info.title))}</ul>
        </li>
        <li>
          <span className="nav-group">Packages</span>
          <ul>{documentedPackages().map((pkg) => item(packageUrl(pkg), pkg.name))}</ul>
        </li>
        {item('/reference/cli', 'Command line')}
        {item('/hosting/environment-variables', 'Environment variables')}
      </ul>
    </div>
  )
}

/** A doc comment from the source, rendered as Markdown with reference links. */
export async function Description({ text, fallback }: { text: string; fallback?: string }) {
  if (!text) return fallback ? <p className="muted">{fallback}</p> : null
  const { html } = await renderMarkdown(text, { link: referenceLinker() })
  return <Prose html={html} />
}

export async function Code({ code, lang = 'ts' }: { code: string; lang?: string }) {
  return <Prose html={await highlight(code, lang)} className="code-block" />
}

export function Source({ source, version }: { source: SourceLocation; version?: string }) {
  return (
    <p className="source">
      <span className="source-label">Source</span>{' '}
      <Link href={`/reference/packages/${packageSlug(source.package)}`}>{source.package}</Link>
      {version ? ` ${version}` : ''} · <code>{`${source.file}:${source.line}`}</code>
    </p>
  )
}

/** The packages' own types a declaration refers to, so readers needn't open the source. */
export async function TypeDefinitions({ types }: { types: readonly TypeDefinition[] }) {
  if (types.length === 0) return null
  return (
    <section aria-labelledby="types">
      <h2 id="types">Types</h2>
      {types.map((type) => (
        <details key={`${type.package}:${type.name}`} className="type-definition">
          <summary>
            <code>{type.name}</code> <span className="muted">from {type.package}</span>
          </summary>
          <Code code={type.text} />
        </details>
      ))}
    </section>
  )
}

/** The first sentence of a doc comment, for lists. */
export function summaryOf(description: string): string {
  const flat = description.replace(/\s+/g, ' ').trim()
  const end = flat.search(/\.(\s|$)/)
  return (end < 0 ? flat : flat.slice(0, end + 1)).replace(/`/g, '')
}
