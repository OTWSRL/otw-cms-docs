import { expect, test, type Page } from '@playwright/test'

/** The page doesn't scroll sideways: everything fits the viewport's width. */
async function fitsWidth(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test('the home page leads to every handbook and the reference', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('OTW CMS Documentation')
  await expect(page.getByRole('heading', { level: 1, name: 'Documentation' })).toBeVisible()
  for (const name of [
    'Documentation',
    'Plugin Handbook',
    'Theme Handbook',
    'Hosting',
    'Code Reference',
  ]) {
    await expect(page.getByRole('link', { name: new RegExp(`^${name}`) }).first()).toBeVisible()
  }
  await fitsWidth(page)
})

test('a handbook page has its chapters, contents, breadcrumbs and next page', async ({
  page,
  isMobile,
}) => {
  await page.goto('/plugins/hooks')
  await expect(page).toHaveTitle('Hooks – Plugin Handbook · OTW CMS Documentation')
  await expect(page.getByRole('heading', { level: 1, name: 'Hooks' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumbs' })).toContainText(
    'Plugin Handbook',
  )
  const sections = page.getByRole('navigation', { name: 'Sections' })
  await expect(sections.getByRole('link', { name: 'Plugins', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  )

  if (isMobile) {
    // On phones the chapters fold away under a toggle.
    await page.getByText('Browse this section').click()
  }
  const chapters = page.locator(isMobile ? '.docs-sidebar-toggle' : '.docs-sidebar')
  await expect(chapters.getByRole('link', { name: 'Hooks', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await page.getByRole('link', { name: /^Next/ }).click()
  await expect(page).toHaveURL('/plugins/hooks/actions')
  await expect(page.getByRole('heading', { level: 1, name: 'Actions' })).toBeVisible()
  await fitsWidth(page)
})

test('code in the handbooks links to the reference, which shows types and usage', async ({
  page,
}) => {
  await page.goto('/plugins/hooks/actions')
  await page.getByRole('link', { name: 'commerce.order.paid' }).first().click()
  await expect(page).toHaveURL('/reference/actions/commerce.order.paid')
  await expect(page.getByText('Action', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Payload' })).toBeVisible()
  await expect(page.getByText('An order was paid')).toBeVisible()

  await page.getByText('Order', { exact: true }).first().click()
  await expect(page.locator('details[open]').first()).toContainText('export interface Order')
  await expect(page.getByText('Fired in')).toBeVisible()
  await fitsWidth(page)
})

test('the package reference lists exports with their signatures', async ({ page }) => {
  await page.goto('/reference/packages/sdk')
  await page.getByRole('link', { name: 'definePlugin', exact: true }).click()
  await expect(page).toHaveURL('/reference/packages/sdk/definePlugin')
  await expect(
    page.getByText('function definePlugin(definition: PluginDefinition): PluginDefinition'),
  ).toBeVisible()
  await expect(page.getByText("import { definePlugin } from '@otwdesign/sdk'")).toBeVisible()
})

test('search finds handbook pages and reference entries', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('main').getByRole('searchbox', { name: 'Search the documentation' })
  await search.fill('definePlugin')
  await search.press('Enter')
  await expect(page).toHaveURL('/search?q=definePlugin')
  await expect(page.getByRole('status')).toContainText('for “definePlugin”')
  await expect(page.locator('.search-results li').first()).toContainText('definePlugin')

  await page.goto('/search?q=zzqxv')
  await expect(page.getByRole('status')).toHaveText('Nothing found for “zzqxv”.')
})

test('a missing page is a 404 that offers search', async ({ page }) => {
  const response = await page.goto('/plugins/no-such-page')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('main').getByRole('searchbox')).toBeVisible()
})

test('the site still runs the CMS: its admin is at /admin', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/(setup|login)/)
})
