import { describe, expect, it } from 'vitest'
import { parseMeta, renderMarkdown } from '@/docs/markdown'

describe('renderMarkdown', () => {
  it('highlights code, and captions and collects whole files', async () => {
    const { html, files } = await renderMarkdown(
      '```ts filename="src/index.ts"\nexport const answer = 42\n```\n\n```bash\nnpm run dev\n```',
    )
    expect(html).toContain('<figcaption>src/index.ts</figcaption>')
    expect(html).toContain('class="shiki github-light"')
    expect(html).toMatch(/<span style="color:#[0-9A-F]{6}">export<\/span>/i)
    expect(files).toEqual([
      { lang: 'ts', filename: 'src/index.ts', code: 'export const answer = 42' },
    ])
  })

  it('falls back to plain text for languages it doesn’t know', async () => {
    const { html } = await renderMarkdown('```cobol\nDISPLAY "HI"\n```')
    expect(html).toContain('DISPLAY')
  })

  it('turns GitHub’s [!NOTE] blockquotes into notices', async () => {
    const { html } = await renderMarkdown('> [!WARNING]\n> Back up first.')
    expect(html).toContain('<aside class="callout callout-warning">')
    expect(html).toContain('<p class="callout-title">Warning</p>')
    expect(html).toContain('Back up first.')
    expect(html).not.toContain('[!WARNING]')
  })

  it('leaves ordinary quotes alone', async () => {
    const { html } = await renderMarkdown('> Just a quote.')
    expect(html).toContain('<blockquote>')
  })

  it('drops raw HTML instead of passing it through', async () => {
    const { html } = await renderMarkdown('Hi <script>alert(1)</script> & <b>bold</b>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&#x26;')
  })

  it('collects the table of contents and links each heading to itself', async () => {
    const { html, headings } = await renderMarkdown(
      '# Title\n\n## Getting started\n\n### Next steps\n\n#### Deeper',
    )
    expect(headings).toEqual([
      { depth: 2, id: 'getting-started', text: 'Getting started' },
      { depth: 3, id: 'next-steps', text: 'Next steps' },
    ])
    expect(html).toContain(
      '<h2 id="getting-started">Getting started<a class="heading-anchor" href="#getting-started"',
    )
  })

  it('links inline code that names something in the reference, but not code blocks or links', async () => {
    const link = (name: string) =>
      name === 'definePlugin' ? '/reference/packages/sdk/definePlugin' : undefined
    const { html } = await renderMarkdown(
      'Call `definePlugin()` or `definePlugin`, not `other`. [`definePlugin`](/x)\n\n```ts\ndefinePlugin\n```',
      { link },
    )
    expect(html.match(/class="reference-link"/g)).toHaveLength(2)
    expect(html).toContain('<code>other</code>')
    expect(html).toContain('<a href="/x"><code>definePlugin</code></a>')
  })

  it('marks links that leave the site', async () => {
    const { html } = await renderMarkdown('[npm](https://www.npmjs.com) and [home](/)')
    expect(html).toContain('<a href="https://www.npmjs.com" rel="noopener noreferrer">npm</a>')
    expect(html).toContain('<a href="/">home</a>')
  })
})

describe('parseMeta', () => {
  it('reads key="value" pairs after the language', () => {
    expect(parseMeta('filename="src/a b.ts" check="no"')).toEqual({
      filename: 'src/a b.ts',
      check: 'no',
    })
    expect(parseMeta(undefined)).toEqual({})
  })
})
