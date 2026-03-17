
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
});
