import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '../../.env');

function parseEnv(raw) {
  return raw.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return acc;
    }

    const index = trimmed.indexOf('=');
    if (index === -1) {
      return acc;
    }

    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^"|"$/g, '');
    acc[key] = value;
    return acc;
  }, {});
}

if (fs.existsSync(envPath)) {
  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node ../../scripts/with-root-env.mjs <command> [...args]');
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: [
      path.resolve(process.cwd(), 'node_modules/.bin'),
      path.resolve(process.cwd(), '../../node_modules/.bin'),
      process.env.PATH,
    ]
      .filter(Boolean)
      .join(path.delimiter),
  },
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(`Failed to run "${command}": ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
