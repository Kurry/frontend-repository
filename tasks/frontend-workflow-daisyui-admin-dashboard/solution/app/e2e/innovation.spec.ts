/* NOT-AUTOMATABLE: innovation.catchall requires identifying an uncatalogued enhancement; all named bonuses are deterministic. */
import {archiveFirst,createUser,load,openExport,openUsers,test,expect} from './helpers'

test.beforeEach(async({page})=>{await load(page);await openUsers(page)})

test('11.1 export_summary_strip_bonus',async({page})=>{await archiveFirst(page);const d=await openExport(page);await expect(d.locator('.export-summary')).toContainText(/Active users.*11.*Archived.*1/s)})

test('11.2 command_palette_shortcut_hint_bonus',async({page})=>{await expect(page.locator('.command-button .kbd')).toContainText(/⌘ K|Ctrl K/);await page.getByRole('button',{name:'Open Command palette'}).click();await expect(page.locator('.command-card .kbd')).toContainText('ESC')})

test('11.3 last_mutation_chip_bonus',async({page})=>{await createUser(page,'Mutation','Chip','mutation@example.dev');await expect(page.locator('.mutation-chip')).toContainText(/User created.*mutation@example.dev/s)})

test('11.4 copied_confirmation_polish_bonus',async({page,context})=>{await context.grantPermissions(['clipboard-read','clipboard-write']);const d=await openExport(page);await d.getByRole('button',{name:'Copy'}).click();const toast=page.getByRole('status');await expect(toast).toContainText('Directory JSON copied to the clipboard');expect(await toast.evaluate(n=>Number.parseFloat(getComputedStyle(n).animationDuration))).toBeGreaterThan(0)})
