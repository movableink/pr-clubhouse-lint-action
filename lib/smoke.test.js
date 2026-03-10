import { describe, it, expect } from '@jest/globals';
import { spawnSync, execSync } from 'child_process';

describe('build artifact', () => {
  it('builds without error', () => {
    const result = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  });

  it('dist/index.js loads without missing dependencies or dynamic require errors', () => {
    // Attempt to import the bundle. The action itself will throw because there
    // is no real GitHub context, but that's a runtime error — not a bundling error.
    // We only fail if we see a bundling-specific error.
    const result = spawnSync('node', ['--input-type=module', '--eval', `
      import('./dist/index.js').catch(e => {
        const isBundlingError =
          e.code === 'ERR_MODULE_NOT_FOUND' ||
          (e.message && e.message.includes('Dynamic require'));
        if (isBundlingError) {
          console.error(e.message);
          process.exit(1);
        }
        process.exit(0);
      });
    `], { encoding: 'utf8' });

    expect(result.status).toBe(0);
  });
});
