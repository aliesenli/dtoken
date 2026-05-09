import { join } from 'node:path';
import type { Plugin, TokenNode } from '@dtt/core';

function setNested(
  obj: Record<string, unknown>,
  path: string[],
  node: TokenNode
): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  const leaf: Record<string, unknown> = {
    $value: node.value,
    $type: node.type,
  };
  if (node.description) leaf.$description = node.description;
  current[path[path.length - 1]] = leaf;
}

export function dtcgOutputPlugin(outputDir: string): Plugin {
  return {
    name: 'dtt:dtcg-output',
    hooks: {
      output({ graph, write }) {
        const result: Record<string, unknown> = {};
        for (const key of graph.order) {
          const node = graph.nodes.get(key)!;
          setNested(result, node.path, node);
        }
        write(join(outputDir, 'tokens.dtcg.json'), JSON.stringify(result, null, 2));
      },
    },
  };
}
