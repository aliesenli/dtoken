import { describe, it, expect, vi } from 'vitest';
import { validate } from '@/pipeline/validator.js';
import type { TokenGraph, Plugin } from '@/graph/types.js';

function makeGraph(tokens: Record<string, { type: string; value: string }>): TokenGraph {
  const nodes = new Map(
    Object.entries(tokens).map(([k, v]) => [
      k,
      { path: k.split('.'), value: v.value, rawValue: v.value, type: v.type },
    ])
  );
  return { nodes, order: [...nodes.keys()].sort() };
}

describe('validate', () => {
  it('passes for a valid graph with no plugins', () => {
    const graph = makeGraph({ 'color.primary': { type: 'color', value: '#ff0000' } });
    expect(() => validate(graph, [], false)).not.toThrow();
  });

  it('collects SCHEMA_ERROR for unknown $type', () => {
    const graph = makeGraph({ 'color.primary': { type: 'colours', value: '#ff0000' } });
    expect(() => validate(graph, [], true)).toThrow();
  });

  it('collects multiple errors before throwing', () => {
    const graph = makeGraph({
      'color.primary': { type: 'colours', value: '#ff0000' },
      'spacing.xs': { type: 'dimensionn', value: '4px' },
    });
    let thrown: unknown;
    try {
      validate(graph, [], true);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeDefined();
    expect((thrown as { errors: unknown[] }).errors).toHaveLength(2);
  });

  it('allows empty type in non-strict mode', () => {
    const graph = makeGraph({ 'color.primary': { type: '', value: '#ff0000' } });
    expect(() => validate(graph, [], false)).not.toThrow();
  });

  it('reports SCHEMA_ERROR for empty type in strict mode', () => {
    const graph = makeGraph({ 'color.primary': { type: '', value: '#ff0000' } });
    expect(() => validate(graph, [], true)).toThrow();
  });

  it('calls plugin validate hooks', () => {
    const graph = makeGraph({ 'color.primary': { type: 'color', value: '#ff0000' } });
    const hookFn = vi.fn();
    const plugin: Plugin = { name: 'test', hooks: { validate: hookFn } };
    validate(graph, [plugin], false);
    expect(hookFn).toHaveBeenCalledOnce();
  });
});
