// Dynasty is the authoring source; both standalone deployments ship this history.
import { cpSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const source = fileURLToPath(new URL('../prisma/', import.meta.url));
const target = fileURLToPath(new URL('../../ManuscriptBuilder/prisma/', import.meta.url));
if (!existsSync(target)) throw new Error('Check out ManuscriptBuilder beside DynastyTreeBuilder first.');
if (process.argv.includes('--check')) {
  for (const path of ['schema.prisma', ...readdirSync(`${source}/migrations`, { recursive: true }).filter(p => p.endsWith('.sql') || p.endsWith('.toml')).map(p => `migrations/${p}`)]) {
    assert.equal(readFileSync(`${target}/${path}`, 'utf8'), readFileSync(`${source}/${path}`, 'utf8'), `Shared database drift: ${path}`);
  }
  assert.deepEqual(readdirSync(`${target}/migrations`).sort(), readdirSync(`${source}/migrations`).sort());
  console.log('PASS: both apps share the same schema and migration history.');
} else {
  cpSync(`${source}/schema.prisma`, `${target}/schema.prisma`);
  cpSync(`${source}/migrations`, `${target}/migrations`, { recursive: true });
  console.log('Shared database schema and migrations copied to ManuscriptBuilder.');
}
