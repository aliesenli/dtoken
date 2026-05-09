import { join } from 'node:path';
import type { Plugin } from '@dtt/core';

export function jsonOutputPlugin(outputDir: string): Plugin {
  return {
    name: 'dtt:json-output',
    hooks: {
      output({ graph, write }) {
        const result: Record<string, { value: unknown; type: string; description?: string }> = {};
        for (const key of graph.order) {
          const node = graph.nodes.get(key)!;
          result[key] = { value: node.value, type: node.type };
          if (node.description) result[key].description = node.description;
        }
        write(join(outputDir, 'tokens.json'), JSON.stringify(result, null, 2));
      },
    },
  };
}
