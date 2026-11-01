import type { Metadata } from 'next'
import Link from 'next/link'
import { search, searchDocs, terms } from '@/docs/search'
import { SearchForm } from '@/docs/ui/chrome'

export const metadata: Metadata = { title: 'Search', robots: { index: false } }

const MAX_QUERY = 200

/** Wraps each searched word in <mark>; React escapes the text around them. */
function Highlighted({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return text
  const pattern = new RegExp(
    `(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  )
  return text
    .split(pattern)
    .map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part))
}

export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const raw = (await searchParams).q
  const query = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, MAX_QUERY).trim() ?? ''
  const results = query ? search(query, await searchDocs()) : []
  const words = terms(query)
  return (
    <main className="narrow" id="main">
      <h1>Search</h1>
      <SearchForm query={query} id="search-page" />
      {query && (
        <p role="status">
          {results.length === 0
            ? `Nothing found for “${query}”.`
            : `${results.length} ${results.length === 1 ? 'result' : 'results'} for “${query}”.`}
        </p>
      )}
      <ol className="search-results">
        {results.map((result) => (
          <li key={result.url}>
            <Link href={result.url}>
              <Highlighted text={result.title} words={words} />
            </Link>
            <span className="search-section">{result.section}</span>
            <p>
              <Highlighted text={result.snippet} words={words} />
            </p>
          </li>
        ))}
      </ol>
    </main>
  )
}
