import type { TokenGraph, Plugin, OutputContext } from '@/graph/types.js';

export function output(
  graph: TokenGraph,
  plugins: Plugin[],
  writeFn: (path: string, content: string) => void
): void {
  const ctx: OutputContext = {
    graph,
    write: writeFn,
  };

  for (const plugin of plugins) {
    try {
      plugin.hooks?.output?.(ctx);
    } catch (err) {
      throw Object.assign(new Error(`Plugin "${plugin.name}" failed in output: ${String(err)}`), {
        code: 'PLUGIN_ERROR' as const,
        message: `Plugin "${plugin.name}" failed in output: ${String(err)}`,
      });
    }
  }
}
