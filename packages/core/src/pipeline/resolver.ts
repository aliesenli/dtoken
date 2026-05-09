import type { TokenGraph, DTTError } from '@/graph/types.js';
import type { TokenValue } from '@/graph/values.js';

const REF_PATTERN = /^\{([\w][\w.]*)\}$/;

function makeError(code: DTTError['code'], message: string, tokenPath?: string): DTTError & Error {
  return Object.assign(new Error(message), { code, message, tokenPath });
}

function resolveScalarRef(
  key: string,
  graph: TokenGraph,
  visited: Set<string>,
  resolved: Set<string>
): TokenValue {
  if (resolved.has(key)) return graph.nodes.get(key)!.value;
  if (visited.has(key)) throw makeError('CIRCULAR_REFERENCE', `Circular reference detected at "${key}"`, key);

  const node = graph.nodes.get(key);
  if (!node) throw makeError('MISSING_REFERENCE', `Token "${key}" does not exist`, key);

  const match = REF_PATTERN.exec(node.rawValue);
  if (!match) {
    resolved.add(key);
    return node.value;
  }

  const refKey = match[1];
  visited.add(key);
  const resolvedValue = resolveScalarRef(refKey, graph, visited, resolved);
  visited.delete(key);
  node.value = resolvedValue;
  resolved.add(key);
  return resolvedValue;
}

function resolveValueRefs(
  value: TokenValue,
  graph: TokenGraph,
  visited: Set<string>,
  resolved: Set<string>
): TokenValue {
  if (typeof value === 'string') {
    const match = REF_PATTERN.exec(value);
    if (!match) return value;
    return resolveScalarRef(match[1], graph, visited, resolved);
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item =>
        resolveValueRefs(item as TokenValue, graph, visited, resolved)
      ) as TokenValue;
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveValueRefs(v as TokenValue, graph, visited, resolved);
    }
    return result as TokenValue;
  }
  return value;
}

export function resolve(graph: TokenGraph): void {
  const resolved = new Set<string>();
  for (const key of graph.nodes.keys()) {
    resolveScalarRef(key, graph, new Set(), resolved);
  }
  for (const node of graph.nodes.values()) {
    node.value = resolveValueRefs(node.value, graph, new Set(), new Set(resolved));
  }
}
