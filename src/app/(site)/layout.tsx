import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/cms/site.generated'
import { cmsVersion } from '@/docs/reference'
import { SiteFooter, SiteHeader } from '@/docs/ui/chrome'
import '../docs.css'

// The documentation's root layout, like a WordPress theme's header.php and footer.php. Pages read
// Markdown and the generated reference, not the database, so they're prerendered at build.

export const metadata: Metadata = {
  title: { default: 'OTW CMS Documentation', template: '%s · OTW CMS Documentation' },
  description:
    'How to run, extend and host OTW CMS: the user guide, the Plugin and Theme Handbooks, hosting, and the Code Reference.',
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter version={cmsVersion()} />
      </body>
    </html>
  )
}
