import Link from 'next/link'
import { SearchForm } from '@/docs/ui/chrome'

export default function NotFound() {
  return (
    <main className="narrow" id="main">
      <h1>Page not found</h1>
      <p>That page doesn’t exist, or it has moved. Search for it instead:</p>
      <SearchForm id="not-found-search" />
      <p>
        Or start from the <Link href="/">documentation home</Link>.
      </p>
    </main>
  )
}
