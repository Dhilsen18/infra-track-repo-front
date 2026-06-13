/**
 * Se ejecuta antes de `ng build`. Si en Vercel/CI defines INFRATRACK_API_*,
 * se escriben en `api-bases.inject.ts`; si no, se usa el backend en Render.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'src', 'app', 'shared', 'infrastructure', 'api-bases.inject.ts');

const renderApiBase = 'https://infratrack-api.onrender.com/api/v1';

const defaults = {
  controlPanel: renderApiBase,
  assetManagement: renderApiBase,
  telemetry: renderApiBase,
  operations: renderApiBase,
  subscriptions: renderApiBase,
  identity: renderApiBase,
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
  const globalBase = process.env.INFRATRACK_API_BASE_URL?.trim();
  if (globalBase) return globalBase;
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
