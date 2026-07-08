import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env');
const requiredKeys = ['DATABASE_URL', 'API_PORT', 'ADMIN_API_TOKEN'];
const recommendedKeys = ['NEXT_PUBLIC_API_BASE_URL', 'ADMIN_SERVER_API_TOKEN'];

function parseEnv(raw) {
  const entries = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      const key = line.slice(0, index);
      const value = line.slice(index + 1).replace(/^"|"$/g, '');
      return [key, value];
    });

  return { entries, env: Object.fromEntries(entries) };
}

if (!fs.existsSync(envPath)) {
  console.error('Missing .env file. Copy .env.example or .env.neon.example to .env first.');
  process.exit(1);
}

const { entries, env } = parseEnv(fs.readFileSync(envPath, 'utf8'));
const missing = requiredKeys.filter((key) => !env[key]);
const missingRecommended = recommendedKeys.filter((key) => !env[key]);
const duplicateKeys = entries
  .map(([key]) => key)
  .filter((key, index, keys) => keys.indexOf(key) !== index);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

if (duplicateKeys.length > 0) {
  console.error(`Duplicate env vars found: ${[...new Set(duplicateKeys)].join(', ')}`);
  process.exit(1);
}

if (env.ADMIN_API_TOKEN === 'replace-with-a-long-random-token') {
  console.error('ADMIN_API_TOKEN still uses the placeholder value.');
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(`Recommended env vars not set: ${missingRecommended.join(', ')}`);
}

if (!env.DATABASE_URL.includes('postgresql://') && !env.DATABASE_URL.includes('postgres://')) {
  console.error('DATABASE_URL must be a Postgres connection string.');
  process.exit(1);
}

if (env.DATABASE_URL.includes('HOST')) {
  console.error('DATABASE_URL still contains the HOST placeholder.');
  process.exit(1);
}

if (env.DATABASE_URL.includes('neon.tech') && !env.DATABASE_URL.includes('sslmode=require')) {
  console.warn('Neon DATABASE_URL should usually include sslmode=require.');
}

console.log('Environment looks ready.');
