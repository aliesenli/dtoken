import { describe, it, expect } from 'vitest';
import { flattenInto } from '@/graph/flattener.js';
import type { TokenNode } from '@/graph/types.js';

describe('flattenInto', () => {
  it('flattens a scalar string token', () => {
    const nodes = new Map<string, TokenNode>();
    flattenInto({ color: { primary: { $value: '#3b82f6', $type: 'color' } } }, [], 'test.json', nodes);
    expect(nodes.get('color.primary')!.value).toBe('#3b82f6');
    expect(nodes.get('color.primary')!.rawValue).toBe('#3b82f6');
  });

  it('flattens a scalar number token', () => {
    const nodes = new Map<string, TokenNode>();
    flattenInto({ font: { weight: { bold: { $value: 700, $type: 'fontWeight' } } } }, [], 'test.json', nodes);
    expect(nodes.get('font.weight.bold')!.value).toBe(700);
    expect(nodes.get('font.weight.bold')!.rawValue).toBe('700');
  });

  it('flattens a composite color value and stores rawValue as JSON', () => {
    const nodes = new Map<string, TokenNode>();
    const colorObj = { colorSpace: 'srgb', components: [0, 0.5, 1] };
    flattenInto({ color: { primary: { $value: colorObj, $type: 'color' } } }, [], 'test.json', nodes);
    const node = nodes.get('color.primary')!;
    expect(node.value).toEqual(colorObj);
    expect(node.rawValue).toBe(JSON.stringify(colorObj));
  });

  it('flattens a dimension object value', () => {
    const nodes = new Map<string, TokenNode>();
    flattenInto({ spacing: { base: { $value: { value: 2, unit: 'rem' }, $type: 'dimension' } } }, [], 'test.json', nodes);
    expect(nodes.get('spacing.base')!.value).toEqual({ value: 2, unit: 'rem' });
  });

  it('throws PARSE_ERROR for token missing $value when $ keys present', () => {
    const nodes = new Map<string, TokenNode>();
    expect(() =>
      flattenInto({ color: { primary: { $type: 'color' } } }, [], 'test.json', nodes)
    ).toThrow();
  });

  it('recurses into nested groups', () => {
    const nodes = new Map<string, TokenNode>();
    flattenInto({
      color: {
        blue: {
          '500': { $value: '#3b82f6', $type: 'color' },
        },
      },
    }, [], 'test.json', nodes);
    expect(nodes.has('color.blue.500')).toBe(true);
  });
});
