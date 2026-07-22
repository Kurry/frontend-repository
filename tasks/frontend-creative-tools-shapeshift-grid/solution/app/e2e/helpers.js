import { expect, test } from '@playwright/test'

export { expect, test }
export const cells = page => page.getByRole('gridcell')
export const cards = page => page.locator('.board-card')
export const toolbar = page => page.getByLabel('SHAPESHIFT tools')

export async function load(page) {
  const faults = []
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { throw new Error('camera unavailable in deterministic test') } } })
  })
  page.on('console', message => { if (message.type() === 'error') faults.push(`console: ${message.text()}`) })
  page.on('pageerror', error => faults.push(`pageerror: ${error.message}`))
  await page.goto('/')
  await expect(page.getByRole('grid', { name: /SHAPESHIFT paint grid/ })).toBeVisible()
  test.info().annotations.push({ type: 'diagnostics', description: 'console.error and pageerror are asserted after every test' })
  page.__assertClean = async () => expect(faults, faults.join('\n')).toEqual([])
  return page.__assertClean
}

export async function assertClean(page) { await page.__assertClean?.() }

export async function paint(page, indexes = [0]) {
  for (const index of indexes) { await cells(page).nth(index).click({ force: true }); await page.waitForTimeout(20) }
}

export async function clear(page) {
  await page.getByRole('button', { name: 'Clear the board' }).click()
  await page.getByRole('button', { name: /Confirm clear/ }).click()
}

export async function gallery(page) {
  await page.getByRole('button', { name: /^Gallery/ }).click()
  await expect(page.getByLabel('Saved boards gallery')).toBeVisible()
}

export async function save(page, name = `Board ${Date.now()}`, tag = 'Test') {
  await page.getByRole('button', { name: 'Save current board' }).click()
  await page.getByLabel('Name required · max 40').fill(name)
  await page.getByLabel('Tag required · max 24').fill(tag)
  await page.getByRole('button', { name: 'Save board', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Save board' })).toHaveCount(0)
  await gallery(page)
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  return name
}

export async function remove(page, name) {
  const card = cards(page).filter({ has: page.getByRole('heading', { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }) })
  await card.getByRole('button', { name: `Delete ${name}` }).click()
  await card.getByRole('button', { name: `Confirm delete ${name}` }).click()
  await expect(card).toHaveCount(0)
}

export async function removeAll(page) {
  await gallery(page)
  while (await cards(page).count()) {
    const first = cards(page).first()
    const button = first.getByRole('button', { name: /^Delete / })
    const name = (await button.getAttribute('aria-label')).replace(/^Delete /, '')
    const card = cards(page).filter({ has: page.getByRole('heading', { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }) })
    await button.click()
    const confirm = card.getByRole('button', { name: `Confirm delete ${name}` })
    await expect(confirm).toBeVisible()
    await confirm.click()
    await expect(card).toHaveCount(0)
  }
}

export async function openExport(page) {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Export' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function session(page) {
  const dialog = await openExport(page)
  return JSON.parse(await dialog.getByLabel('Session JSON preview').innerText())
}

export async function closeDialog(page, name) {
  await page.getByRole('dialog', { name }).getByRole('button', { name: new RegExp(`Close ${name}`) }).click()
  await expect(page.getByRole('dialog', { name })).toHaveCount(0)
}

export async function importText(page, text) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Import Session JSON' })
  await dialog.getByRole('textbox').fill(text)
  return dialog
}

export async function stats(page) {
  const readout = page.getByLabel('Live fill statistics')
  const text = await readout.innerText()
  const value = label => Number(text.match(new RegExp(`(\\d+)\\s*${label}`, 'i'))?.[1])
  return { painted: value('painted'), qr: value('qr'), colorFilled: value('color filled'), blank: value('blank') }
}

export async function chooseTag(page, tag) {
  await page.getByRole('button', { name: 'Filter boards by tag' }).click()
  await page.getByRole('option', { name: new RegExp(`^${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).click()
}

export async function renameFirst(page, nextName) {
  await gallery(page)
  const first = cards(page).first()
  const oldName = (await first.getByRole('heading').innerText()).trim()
  await first.getByRole('button', { name: `Rename ${oldName}` }).click()
  const dialog = page.getByRole('dialog', { name: 'Rename board' })
  await dialog.getByLabel('Name required · max 40').fill(nextName)
  await dialog.getByRole('button', { name: 'Update board' }).click()
  await expect(dialog).toHaveCount(0)
  return oldName
}

export async function invoke(page, name, args = {}) {
  return page.evaluate(async ({ name, args }) => window.webmcp_invoke_tool({ name, arguments: args }), { name, args })
}
