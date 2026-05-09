import { resolve } from 'node:path';
import type { Plugin } from '@/graph/types.js';

export async function loadPlugins(pluginPaths: string[], configDir: string): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  for (const pluginPath of pluginPaths) {
    const absolutePath = pluginPath.startsWith('.')
      ? resolve(configDir, pluginPath)
      : pluginPath;

    let mod: unknown;
    try {
      const { createJiti } = await import('jiti');
      const jiti = createJiti(absolutePath);
      mod = await jiti.import(absolutePath);
    } catch (err) {
      throw Object.assign(new Error(`Failed to load plugin "${pluginPath}": ${String(err)}`), {
        code: 'PLUGIN_ERROR' as const,
        message: `Failed to load plugin "${pluginPath}": ${String(err)}`,
      });
    }

    const plugin = (mod as { default?: Plugin }).default;
    if (!plugin || typeof plugin.name !== 'string') {
      throw Object.assign(
        new Error(`Plugin "${pluginPath}" must export a default Plugin object with a name`),
        { code: 'PLUGIN_ERROR' as const }
      );
    }

    plugins.push(plugin);
  }

  return plugins;
}
