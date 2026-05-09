import { describe, it, expect } from 'vitest';
import { resolve } from '@/pipeline/resolver.js';
import type { TokenGraph } from '@/graph/types.js';

function makeGraph(tokens: Record<string, { type: string; value: string }>): TokenGraph {
  const nodes = new Map(
    Object.entries(tokens).map(([k, v]) => [
      k,
      { path: k.split('.'), value: v.value, rawValue: v.value, type: v.type },
    ])
  );
  return { nodes, order: [...nodes.keys()].sort() };
}

describe('resolve', () => {
  it('resolves a simple reference', () => {
    const graph = makeGraph({
      'color.primary': { type: 'color', value: '#ff0000' },
      'semantic.bg': { type: 'color', value: '{color.primary}' },
    });
    resolve(graph);
    expect(graph.nodes.get('semantic.bg')!.value).toBe('#ff0000');
  });

  it('resolves chained references', () => {
    const graph = makeGraph({
      'color.red': { type: 'color', value: '#ff0000' },
      'color.primary': { type: 'color', value: '{color.red}' },
      'semantic.bg': { type: 'color', value: '{color.primary}' },
    });
    resolve(graph);
    expect(graph.nodes.get('semantic.bg')!.value).toBe('#ff0000');
  });

  it('throws MISSING_REFERENCE when target does not exist', () => {
    const graph = makeGraph({
      'semantic.bg': { type: 'color', value: '{color.missing}' },
    });
    expect(() => resolve(graph)).toThrow();
    try {
      resolve(graph);
    } catch (e) {
      expect((e as { code: string }).code).toBe('MISSING_REFERENCE');
    }
  });

  it('throws CIRCULAR_REFERENCE on circular dependency', () => {
    const graph = makeGraph({
      'color.a': { type: 'color', value: '{color.b}' },
      'color.b': { type: 'color', value: '{color.a}' },
    });
    expect(() => resolve(graph)).toThrow();
    try {
      resolve(graph);
    } catch (e) {
      expect((e as { code: string }).code).toBe('CIRCULAR_REFERENCE');
    }
  });

  it('leaves non-reference values unchanged', () => {
    const graph = makeGraph({
      'color.primary': { type: 'color', value: '#ff0000' },
    });
    resolve(graph);
    expect(graph.nodes.get('color.primary')!.value).toBe('#ff0000');
  });

  it('resolves {ref} inside a border composite value', () => {
    const graph = makeGraph({
      'color.primary': { type: 'color', value: '#3b82f6' },
      'border.default': { type: 'border', value: '#placeholder' },
    });
    graph.nodes.get('border.default')!.rawValue = JSON.stringify({
      width: { value: 1, unit: 'px' },
      style: 'solid',
      color: '{color.primary}',
    });
    graph.nodes.get('border.default')!.value = {
      width: { value: 1, unit: 'px' },
      style: 'solid',
      color: '{color.primary}',
    };
    resolve(graph);
    const border = graph.nodes.get('border.default')!.value as { color: string };
    expect(border.color).toBe('#3b82f6');
  });

  it('resolves {ref} inside a shadow composite value color field', () => {
    const graph = makeGraph({
      'color.black': { type: 'color', value: '#000000' },
      'shadow.md': { type: 'shadow', value: '#placeholder' },
    });
    graph.nodes.get('shadow.md')!.rawValue = JSON.stringify({
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 4, unit: 'px' },
      blur: { value: 8, unit: 'px' },
      color: '{color.black}',
    });
    graph.nodes.get('shadow.md')!.value = {
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 4, unit: 'px' },
      blur: { value: 8, unit: 'px' },
      color: '{color.black}',
    };
    resolve(graph);
    const shadow = graph.nodes.get('shadow.md')!.value as { color: string };
    expect(shadow.color).toBe('#000000');
  });
});
