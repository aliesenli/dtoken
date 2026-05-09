import { describe, it, expect, vi } from 'vitest';
import { transform } from '@/pipeline/transformer.js';
import type { TokenGraph, Plugin } from '@/graph/types.js';

function makeGraph(): TokenGraph {
  return {
    nodes: new Map([
      ['color.primary', { path: ['color', 'primary'], value: '#ff0000', rawValue: '#ff0000', type: 'color' }],
    ]),
    order: ['color.primary'],
  };
}

describe('transform', () => {
  it('calls plugin transform hooks in order', () => {
    const calls: string[] = [];
    const plugins: Plugin[] = [
      { name: 'a', hooks: { transform: () => { calls.push('a'); } } },
      { name: 'b', hooks: { transform: () => { calls.push('b'); } } },
    ];
    transform(makeGraph(), plugins);
    expect(calls).toEqual(['a', 'b']);
  });

  it('passes mutable graph to transform hook', () => {
    const plugin: Plugin = {
      name: 'mutator',
      hooks: {
        transform({ graph }) {
          const node = graph.nodes.get('color.primary')!;
          node.value = '#000000';
        },
      },
    };
    const graph = makeGraph();
    transform(graph, [plugin]);
    expect(graph.nodes.get('color.primary')!.value).toBe('#000000');
  });

  it('wraps plugin errors as PLUGIN_ERROR', () => {
    const plugin: Plugin = {
      name: 'bad',
      hooks: {
        transform() {
          throw new Error('plugin exploded');
        },
      },
    };
    expect(() => transform(makeGraph(), [plugin])).toThrow();
    try {
      transform(makeGraph(), [plugin]);
    } catch (e) {
      expect((e as { code: string }).code).toBe('PLUGIN_ERROR');
    }
  });

  it('does nothing with no plugins', () => {
    const graph = makeGraph();
    expect(() => transform(graph, [])).not.toThrow();
  });
});
