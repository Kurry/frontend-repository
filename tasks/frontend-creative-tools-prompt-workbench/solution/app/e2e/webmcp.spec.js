import { expect, test, openApp } from './helpers.js'

test('webmcp contract exposes read and mutation tools with DOM synchronization', async ({ page }) => {
  await openApp(page)
  const session = await page.evaluate(() => window.webmcp_session_info())
  expect(session.contract_version).toBe('zto-webmcp-v1')
  expect(session.modules).toHaveLength(4)
  const tools = await page.evaluate(() => window.webmcp_list_tools())
  expect(tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(['editor_preview', 'editor_set_content', 'editor_update_property', 'session_start', 'entity_create', 'artifact_export']))

  await page.evaluate(() => window.webmcp_invoke_tool('editor_set_content', { content: 'Summarize {{topic}}' }))
  await expect(page.getByRole('textbox', { name: 'Prompt editor' })).toContainText('Summarize {{topic}}')
  await expect(page.getByLabel('topic value')).toBeVisible()
  await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { property: 'variable-value', name: 'topic', value: 'WebMCP' }))
  await expect(page.locator('.preview-body')).toContainText('Summarize WebMCP')
  const preview = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview', {}))
  expect(preview.content[0].text).toContain('Summarize WebMCP')
})
