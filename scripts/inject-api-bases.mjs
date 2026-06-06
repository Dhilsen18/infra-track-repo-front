/**
 * Se ejecuta antes de `ng build`. Si en Vercel/CI defines INFRATRACK_API_*,
 * se escriben en `api-bases.inject.ts`; si no, se mantienen los valores por defecto (MockAPI).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'src', 'app', 'shared', 'infrastructure', 'api-bases.inject.ts');

const defaults = {
  controlPanel: 'https://6a02a9550d92f63dd253e48d.mockapi.io/api/v1',
  assetManagement: 'https://6a02a7340d92f63dd253e0e6.mockapi.io/api/v1',
  telemetry: 'https://6a02a70a0d92f63dd253e074.mockapi.io/api/v1',
  operations: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
  subscriptions: 'https://6a0246a80d92f63dd2537cd5.mockapi.io/api/v1',
  identity: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
};

const envNames = {
  controlPanel: 'INFRATRACK_API_CONTROL_PANEL',
  assetManagement: 'INFRATRACK_API_ASSET_MANAGEMENT',
  telemetry: 'INFRATRACK_API_TELEMETRY',
  operations: 'INFRATRACK_API_OPERATIONS',
  subscriptions: 'INFRATRACK_API_SUBSCRIPTIONS',
  identity: 'INFRATRACK_API_IDENTITY',
};

function pick(key) {
  const name = envNames[key];
  const raw = process.env[name];
  const trimmed = raw != null ? String(raw).trim() : '';
  return trimmed || defaults[key];
}

const body = Object.keys(defaults)
  .map((k) => `  ${k}: ${JSON.stringify(pick(k))},`)
  .join('\n');

const content = `// Generado por scripts/inject-api-bases.mjs en cada build. No editar a mano.\n\nexport const INJECTED_API_BASE_URLS = {\n${body}\n} as const;\n`;

writeFileSync(outPath, content, 'utf8');
console.log('[inject-api-bases] wrote', outPath);
