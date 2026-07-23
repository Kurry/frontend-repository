import JSZip from 'jszip';
import type { Plan } from './schema';
import { PlanSchema } from './schema';

export async function parseImportZip(blob: Blob): Promise<Plan> {
  const zip = new JSZip();
  await zip.loadAsync(blob);

  const planJsonFile = zip.file('plan.json');
  if (!planJsonFile) {
    throw new Error('Missing plan.json in artifact.');
  }

  const content = await planJsonFile.async('string');
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error('plan.json is not valid JSON.');
  }

  const result = PlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('plan.json failed schema validation.');
  }

  return result.data;
}
