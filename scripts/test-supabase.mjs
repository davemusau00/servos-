import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const container = `servos-policy-test-${randomUUID()}`;
const run = (args, input) => {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
  return result.stdout;
};
let started = false;
try {
  run(['run', '--rm', '-d', '--name', container, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:18.6-bookworm']);
  started = true;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'postgres'], { stdio: 'ignore' }).status === 0) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error('Disposable PostgreSQL did not start');
  const files = ['tests/supabase/bootstrap.sql', ...readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort().map(f => `supabase/migrations/${f}`), 'tests/supabase/protocol.sql'];
  for (const file of files) {
    run(['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], readFileSync(file, 'utf8'));
    console.log(`Passed: ${file}`);
  }
} finally {
  if (started) run(['stop', container]);
}
