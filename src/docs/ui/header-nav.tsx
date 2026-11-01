'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SECTIONS } from './sections'

/** The main sections, with the one being read marked for assistive technology and styles. */
export function HeaderNav() {
  const pathname = usePathname()
  return (
    <nav className="site-nav" aria-label="Sections">
      <ul>
        {SECTIONS.map((section) => {
          const current = pathname === section.url || pathname.startsWith(`${section.url}/`)
          return (
            <li key={section.url}>
              <Link href={section.url} aria-current={current ? 'true' : undefined}>
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
