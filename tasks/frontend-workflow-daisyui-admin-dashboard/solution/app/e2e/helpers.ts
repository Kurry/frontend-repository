import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ diagnostics: { errors:string[]; warnings:string[]; pageErrors:string[] } }>({
  diagnostics: [async ({page}, use) => {
    const d={errors:[] as string[],warnings:[] as string[],pageErrors:[] as string[]}
    page.on('console',m=>{if(m.type()==='error')d.errors.push(m.text());if(m.type()==='warning')d.warnings.push(m.text())})
    page.on('pageerror',e=>d.pageErrors.push(e.message))
    await use(d)
    expect(d.errors,'console errors').toEqual([]); expect(d.warnings,'console warnings').toEqual([]); expect(d.pageErrors,'page errors').toEqual([])
  },{auto:true}]
})
export { expect }

export const sidebar=(page:Page)=>page.getByRole('complementary',{name:'Primary navigation'})
export async function load(page:Page){await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible()}
export async function openUsers(page:Page){
  if((page.viewportSize()?.width??1440)<1024 && !await page.locator('.sidebar').evaluate(n=>n.classList.contains('open'))) await page.getByRole('button',{name:'Open navigation'}).click()
  if(!await sidebar(page).getByRole('button',{name:'All users',exact:true}).isVisible()) await sidebar(page).getByRole('button',{name:'Users',exact:true}).click()
  await sidebar(page).getByRole('button',{name:'All users',exact:true}).click();await expect(page.getByRole('heading',{name:'All users',exact:true})).toBeVisible()
}
export async function nav(page:Page,name:string){
  if((page.viewportSize()?.width??1440)<1024 && !await page.locator('.sidebar').evaluate(n=>n.classList.contains('open'))) await page.getByRole('button',{name:'Open navigation'}).click()
  const button=sidebar(page).getByRole('button',{name,exact:true}); if(!await button.isVisible()&&name!=='Dashboard') await sidebar(page).getByRole('button',{name:'Users',exact:true}).click(); await button.click()
}
export const total=(page:Page)=>page.locator('[aria-label="User KPIs"] .kpi-card').filter({hasText:'Total'}).locator('strong')
export const active=(page:Page)=>page.locator('[aria-label="User KPIs"] .kpi-card').filter({hasText:'Active'}).locator('strong')
export const suspended=(page:Page)=>page.locator('[aria-label="User KPIs"] .kpi-card').filter({hasText:'Suspended'}).locator('strong')
export const rows=(page:Page)=>page.locator('.data-table tbody tr')

export async function fillUser(page:Page,first='Ada',last='Lovelace',email='ada@example.dev'){
  await page.getByLabel('First name').fill(first);await page.getByLabel('Last name').fill(last);await page.getByLabel('Email').fill(email);await page.getByLabel(/Temporary password/).fill('ValidPass42!')
}
export async function createUser(page:Page,first='Ada',last='Lovelace',email=`ada-${Date.now()}@example.dev`){
  await nav(page,'Add user');await fillUser(page,first,last,email);await page.getByRole('button',{name:'Create user'}).click();await expect(page.getByText(`${first} ${last}`,{exact:true})).toBeVisible();return email
}
export async function openExport(page:Page){await page.getByRole('button',{name:'Export directory',exact:true}).last().click();const d=page.getByRole('dialog',{name:'Export directory'});await expect(d).toBeVisible();return d}
export async function exportJson(page:Page){const d=await openExport(page);await d.getByRole('tab',{name:'Directory JSON'}).click();return JSON.parse((await d.locator('.preview').textContent())!)}
export async function closeExport(page:Page){await page.getByRole('button',{name:'Close export drawer'}).click()}
export async function archiveFirst(page:Page){const row=rows(page).first();const name=(await row.locator('.user-cell strong').innerText()).trim();const email=(await row.locator('.user-cell small').innerText()).trim();await row.getByRole('button',{name:/Delete/}).click();return{name,email}}
export async function archiveByFirst(page:Page,first:string){const row=rows(page).filter({has:page.getByRole('button',{name:`Delete ${first}`})});const name=(await row.locator('.user-cell strong').innerText()).trim();const email=(await row.locator('.user-cell small').innerText()).trim();await row.getByRole('button',{name:`Delete ${first}`}).click();return{name,email}}
export async function importJson(page:Page,payload:unknown){await page.getByRole('button',{name:'Import directory'}).click();const d=page.getByRole('dialog',{name:'Import directory'});await d.getByLabel('Directory JSON text').fill(JSON.stringify(payload));await d.getByRole('button',{name:'Import directory',exact:true}).click()}
export async function selectFirst(page:Page,count=1){for(let i=0;i<count;i++)await rows(page).nth(i).getByRole('checkbox').check()}
export async function names(page:Page){return rows(page).locator('.user-cell strong').allTextContents()}
export async function payments(page:Page){return rows(page).locator('td:nth-child(5)').allTextContents().then(xs=>xs.map(x=>Number(x.replace(/[$,]/g,''))))}
