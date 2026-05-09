import { describe, it, expect } from 'vitest';
import { output } from '@/pipeline/outputter.js';
import type { TokenGraph, Plugin } from '@/graph/types.js';

function makeGraph(): TokenGraph {
  return {
    nodes: new Map([
      ['color.primary', { path: ['color', 'primary'], value: '#ff0000', rawValue: '#ff0000', type: 'color' }],
      ['spacing.xs', { path: ['spacing', 'xs'], value: '4px', rawValue: '4px', type: 'dimension' }],
    ]),
    order: ['color.primary', 'spacing.xs'],
  };
}

describe('output', () => {
  it('calls plugin output hooks', () => {
    const written: Array<{ path: string; content: string }> = [];
    const plugin: Plugin = {
      name: 'collector',
      hooks: {
        output({ write }) {
          write('out/tokens.json', '{}');
        },
      },
    };
    output(makeGraph(), [plugin], (path, content) => written.push({ path, content }));
    expect(written).toHaveLength(1);
    expect(written[0].path).toBe('out/tokens.json');
  });

  it('passes graph nodes to plugin output hook', () => {
    const plugin: Plugin = {
      name: 'inspector',
      hooks: {
        output({ graph, write }) {
          const primary = graph.nodes.get('color.primary')!;
          write('out/check.txt', String(primary.value));
        },
      },
    };
    const written: Array<{ path: string; content: string }> = [];
    output(makeGraph(), [plugin], (p, c) => written.push({ path: p, content: c }));
    expect(written[0].content).toBe('#ff0000');
  });

  it('wraps plugin errors as PLUGIN_ERROR', () => {
    const plugin: Plugin = {
      name: 'bad',
      hooks: {
        output() {
          throw new Error('output exploded');
        },
      },
    };
    expect(() => output(makeGraph(), [plugin], () => {})).toThrow();
    try {
      output(makeGraph(), [plugin], () => {});
    } catch (e) {
      expect((e as { code: string }).code).toBe('PLUGIN_ERROR');
    }
  });
});
