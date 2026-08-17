import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serviceRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function runWithEnv(env) {
  return spawnSync('node', ['src/index.js'], {
    cwd: serviceRoot,
    env,
    encoding: 'utf8',
    timeout: 10_000,
  });
}

describe('startup env validation', () => {
  // Vars are set to '' rather than deleted: dotenv/config only fills in keys absent
  // from process.env, so a deleted key would get silently refilled from the local .env file.
  it('exits with code 1 and logs a fatal message when JWT_SECRET is missing', () => {
    const env = { ...process.env, PORT: '0', JWT_SECRET: '', INTERNAL_SERVICE_SECRET: 'test-internal-secret' };

    const result = runWithEnv(env);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FATAL: Missing required environment variable: JWT_SECRET. Service cannot start.');
  });

  it('exits with code 1 and logs a fatal message when INTERNAL_SERVICE_SECRET is missing', () => {
    const env = { ...process.env, PORT: '0', JWT_SECRET: 'test-secret', INTERNAL_SERVICE_SECRET: '' };

    const result = runWithEnv(env);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'FATAL: Missing required environment variable: INTERNAL_SERVICE_SECRET. Service cannot start.',
    );
  });
});
