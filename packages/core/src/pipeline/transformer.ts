import type { TokenGraph, Plugin, TransformContext } from '@/graph/types.js';

export function transform(graph: TokenGraph, plugins: Plugin[]): void {
  const ctx: TransformContext = { graph };

  for (const plugin of plugins) {
    try {
      plugin.hooks?.transform?.(ctx);
    } catch (err) {
      throw Object.assign(new Error(`Plugin "${plugin.name}" failed in transform: ${String(err)}`), {
        code: 'PLUGIN_ERROR' as const,
        message: `Plugin "${plugin.name}" failed in transform: ${String(err)}`,
      });
    }
  }
}
