import { readFileSync } from 'node:fs';
import type { TokenNode } from '@/graph/types.js';
import type { NormalizedModifier, ResolvedContext, ResolvedDocument } from '@/resolver/types.js';
import { loadResolverDocument } from '@/resolver/document.js';
import { flattenInto } from '@/graph/flattener.js';

function makeError(message: string, file?: string): Error & { code: 'PARSE_ERROR'; file?: string } {
  return Object.assign(new Error(message), {
    code: 'PARSE_ERROR' as const,
    message,
    file,
  });
}

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}

function mergeAndParse(
  sources: string[]
): { nodes: Map<string, TokenNode>; order: string[] } {
  const nodes = new Map<string, TokenNode>();

  for (const source of sources) {
    if (source.startsWith('inline:')) {
      const raw = JSON.parse(source.slice('inline:'.length)) as Record<string, unknown>;
      flattenInto(raw, [], 'inline', nodes);
    } else {
      let raw: Record<string, unknown>;
      try {
        raw = JSON.parse(readFileSync(source, 'utf-8')) as Record<string, unknown>;
      } catch {
        throw makeError(`Failed to parse JSON in "${source}"`, source);
      }
      flattenInto(raw, [], source, nodes);
    }
  }

  const order = [...nodes.keys()].sort();
  return { nodes, order };
}

function enumerateContexts(doc: ResolvedDocument): ResolvedContext[] {
  const modifierItems = doc.orderItems.filter(
    (i): i is NormalizedModifier => i.type === 'modifier'
  );

  const modifierNames = modifierItems.map(m => m.name);
  const modifierContextArrays = modifierItems.map(m => Object.keys(m.contexts));

  const combinations = modifierContextArrays.length > 0
    ? cartesian(modifierContextArrays)
    : [[]];

  const results: ResolvedContext[] = [];

  for (const combo of combinations) {
    const contextMap: Record<string, string> = {};
    modifierNames.forEach((name, i) => { contextMap[name] = combo[i]; });

    const sources: string[] = [];
    for (const item of doc.orderItems) {
      if (item.type === 'set') {
        sources.push(...item.filePaths);
      } else {
        const selected = contextMap[item.name];
        sources.push(...(item.contexts[selected] ?? []));
      }
    }

    const { nodes, order } = mergeAndParse(sources);
    results.push({ context: contextMap, graph: { nodes, order } });
  }

  return results;
}

export async function parseResolver(resolverPath: string): Promise<ResolvedContext[]> {
  const doc = loadResolverDocument(resolverPath);
  return enumerateContexts(doc);
}
