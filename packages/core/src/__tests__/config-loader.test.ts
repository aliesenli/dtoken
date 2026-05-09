import { describe, it, expect } from 'vitest';
import { loadConfig } from '@/config/loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir() {
  const dir = join(tmpdir(), `dtt-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('loadConfig', () => {
  it('returns defaults when no config file exists', async () => {
    const dir = makeTmpDir();
    const config = await loadConfig(join(dir, 'dtt.config.ts'));
    expect(config).toEqual({ plugins: [], output: './dist/tokens', strict: false });
    rmSync(dir, { recursive: true });
  });

  it('loads and merges a config file', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'dtt.config.ts'),
      `export default { strict: true, output: './out' };`
    );
    const config = await loadConfig(join(dir, 'dtt.config.ts'));
    expect(config.strict).toBe(true);
    expect(config.output).toBe('./out');
    expect(config.plugins).toEqual([]);
    rmSync(dir, { recursive: true });
  });

  it('throws CONFIG_ERROR if config file is invalid JS', async () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'dtt.config.ts'), `export default {{{`);
    await expect(loadConfig(join(dir, 'dtt.config.ts'))).rejects.toMatchObject({
      code: 'CONFIG_ERROR',
    });
    rmSync(dir, { recursive: true });
  });
});
