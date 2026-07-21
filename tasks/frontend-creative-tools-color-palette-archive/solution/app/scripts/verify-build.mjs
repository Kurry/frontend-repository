// verify:build gate — exits 0 only when the app entry exists, every asset it
// references is on disk, and every JS module parses.
import { accessSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fail = (msg) => { console.error(`verify:build FAILED — ${msg}`); process.exit(1); };

try {
  accessSync(join(ROOT, 'index.html'));
} catch {
  fail('index.html is missing');
}

const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)].map((m) => m[1]);
for (const ref of refs) {
  try {
    accessSync(join(ROOT, ref));
  } catch {
    fail(`index.html references ./${ref}, which does not exist`);
  }
}

for (const font of readdirSync(join(ROOT, 'fonts'))) {
  if (!/\.(woff2?)$/.test(font)) fail(`unexpected file in fonts/: ${font}`);
}

const jsFiles = readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js'));
if (jsFiles.length === 0) fail('no JS modules found in js/');
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', join(ROOT, 'js', f)], { stdio: 'pipe' });
  } catch (err) {
    fail(`js/${f} does not parse: ${err.stderr?.toString().trim()}`);
  }
}

console.log(`verify:build OK — index.html + ${refs.length} referenced assets + ${jsFiles.length} JS modules.`);
