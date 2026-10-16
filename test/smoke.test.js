
import { describe, it, expect } from '@jest/globals';
import { spawnSync } from 'child_process';

describe('build artifact', () => {
  it('builds without error', () => {
    const result = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  });

  it('dist/index.js loads without missing dependencies or dynamic require errors', () => {
    const result = spawnSync('node', ['--input-type=commonjs', '-e', `
      process.on('unhandledRejection', (e) => {
        const isBundlingError =
          e.code === 'MODULE_NOT_FOUND' ||
          (e.message && e.message.includes('Dynamic require'));
        process.exit(isBundlingError ? 1 : 0);
      });
      try { require('./dist/index.js'); } catch(e) {
        const isBundlingError =
          e.code === 'MODULE_NOT_FOUND' ||
          (e.message && e.message.includes('Dynamic require'));
        process.exit(isBundlingError ? 1 : 0);
      }
    `], { encoding: 'utf8' });

    expect(result.status).toBe(0);
  });

  // The runner starts the action with `node dist/index.js`, so the bundle must load as an
  // entrypoint, where the nearest package.json decides whether it is CommonJS or ESM.
  it('dist/index.js runs as an entrypoint the way the Actions runner starts it', () => {
    const result = spawnSync('node', ['dist/index.js'], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, GITHUB_EVENT_NAME: 'push' },
    });
    const output = result.stdout + result.stderr;

    expect(output).not.toMatch(/ReferenceError|SyntaxError|ERR_REQUIRE_ESM|MODULE_NOT_FOUND|Dynamic require/);
    expect(output).toContain('Using movableink-PR-check profile');
  });
});
