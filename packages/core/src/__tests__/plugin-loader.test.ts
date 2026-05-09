import { describe, it, expect } from 'vitest';
import { loadPlugins } from '@/config/plugin-loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('loadPlugins', () => {
  it('returns empty array for no plugin paths', async () => {
    const plugins = await loadPlugins([], '/some/config/dir');
    expect(plugins).toEqual([]);
  });

  it('loads a local plugin by relative path', async () => {
    const dir = join(tmpdir(), `dtt-plugins-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'my-plugin.ts'),
      `export default { name: 'my-plugin', hooks: {} };`
    );
    const plugins = await loadPlugins(['./my-plugin.ts'], dir);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe('my-plugin');
    rmSync(dir, { recursive: true });
  });

  it('throws PLUGIN_ERROR if plugin file does not export a default', async () => {
    const dir = join(tmpdir(), `dtt-plugins-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'bad.ts'), `export const x = 1;`);
    await expect(loadPlugins(['./bad.ts'], dir)).rejects.toMatchObject({ code: 'PLUGIN_ERROR' });
    rmSync(dir, { recursive: true });
  });
});
