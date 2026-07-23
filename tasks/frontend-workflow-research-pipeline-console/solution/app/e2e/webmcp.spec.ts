import { test, expect } from './fixtures';
import { openApp } from './helpers';

test('WebMCP contract exposes browser globals, validates, and mutates visible state', async ({ page }) => {
  await openApp(page);
  const info = await page.evaluate(() => window.webmcp_session_info());
  expect(info.contract_version).toBe('zto-webmcp-v1');
  expect(info.modules).toEqual(['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1']);
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(tools.map((tool: { name: string }) => tool.name)).toEqual(expect.arrayContaining(['browse_open', 'browse_apply_filter', 'browse_sort', 'form_validate', 'form_submit', 'form_cancel', 'session_pause', 'session_resume', 'session_restart', 'artifact_copy']));
  const emptySearch = await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'oracle-ci-no-match' }));
  expect(emptySearch).toMatchObject({ ok: true, visibleState: { query: 'oracle-ci-no-match', matches: [] } });
  const invalid = await page.evaluate(() => window.webmcp_invoke_tool('form_validate', { 'job-type': 'evaluate', dataset: 'Helix-12K', model: 'quill-2b-ft-1027', count: 5, cluster: 'aurora' }));
  expect(invalid.ok).toBe(false); expect(invalid.visibleState.fields).toContain('benchmark'); await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => window.webmcp_invoke_tool('form_cancel', {})); await expect(page.getByRole('dialog')).toHaveCount(0);
  const opened = await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'datasets' }));
  expect(opened.ok).toBe(true); await expect(page.getByRole('heading', { name: 'Datasets', exact: true })).toBeVisible();
  const filtered = await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filter: 'dataset', value: 'Helix-12K' }));
  expect(filtered.visibleState.datasetFilter).toBe('Helix-12K'); await expect(page.locator('.active-filter')).toContainText('Helix-12K');
});

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: Record<string, unknown>) => Promise<any>;
  }
}
