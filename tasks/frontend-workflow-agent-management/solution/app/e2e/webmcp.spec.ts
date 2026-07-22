import { test, expect } from './fixtures';
import { openApp, row, total } from './helpers';

declare global {
  interface Window {
    webmcp_session_info: () => unknown;
    webmcp_list_tools: () => { tools: Array<{ name: string }> };
    webmcp_invoke_tool: (name: string, payload: Record<string, unknown>) => unknown;
  }
}

test('WebMCP read and mutation results stay synchronized with the visible DOM', async ({ page }) => {
  await openApp(page);
  const contract = await page.evaluate(() => ({
    session: window.webmcp_session_info(),
    tools: window.webmcp_list_tools().tools.map((tool) => tool.name),
  }));
  expect(contract.session).toBeTruthy();
  expect(contract.tools).toEqual(expect.arrayContaining(['browse_open', 'entity_create', 'session_pause']));

  await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'agent-registry' }));
  await expect(page.getByRole('heading', { name: 'Agent registry' })).toBeVisible();

  const created = await page.evaluate(() => window.webmcp_invoke_tool('entity_create', {
    name: 'WebMCP Signal',
    agentType: 'aster',
    editorIntegration: 'vector',
    accessKey: 'webmcp_signal_key_2026',
  }));
  expect(created).toBeTruthy();
  await expect(row(page, 'WebMCP Signal')).toHaveCount(1);
  await expect(total(page)).toHaveText('10');

  await page.evaluate(() => window.webmcp_invoke_tool('session_pause', { agent: 'Aster Finch' }));
  await expect(row(page, 'Aster Finch')).toContainText('Paused');
});
