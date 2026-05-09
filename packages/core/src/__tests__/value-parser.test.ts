import { describe, it, expect } from 'vitest';
import { parseTokenValue } from '@/graph/value-parser.js';

describe('parseTokenValue', () => {
  // Scalar passthrough
  it('returns string scalars unchanged', () => {
    expect(parseTokenValue('#3b82f6', 'color', 'color.primary')).toBe('#3b82f6');
  });

  it('returns number scalars unchanged', () => {
    expect(parseTokenValue(400, 'fontWeight', 'font.weight.regular')).toBe(400);
  });

  // Color composite
  it('parses sRGB color object', () => {
    const result = parseTokenValue(
      { colorSpace: 'srgb', components: [0, 0.5, 1] },
      'color', 'color.primary'
    );
    expect(result).toEqual({ colorSpace: 'srgb', components: [0, 0.5, 1] });
  });

  it('parses oklch color with alpha', () => {
    const result = parseTokenValue(
      { colorSpace: 'oklch', components: [0.7, 0.15, 180], alpha: 0.8 },
      'color', 'color.primary'
    );
    expect(result).toEqual({ colorSpace: 'oklch', components: [0.7, 0.15, 180], alpha: 0.8 });
  });

  it('throws PARSE_ERROR for color missing colorSpace', () => {
    expect(() =>
      parseTokenValue({ components: [0, 0.5, 1] }, 'color', 'color.primary')
    ).toThrow(/color\.primary/);
  });

  it('throws PARSE_ERROR for color missing components', () => {
    expect(() =>
      parseTokenValue({ colorSpace: 'srgb' }, 'color', 'color.primary')
    ).toThrow(/color\.primary/);
  });

  // Dimension composite
  it('parses dimension object', () => {
    const result = parseTokenValue({ value: 2, unit: 'rem' }, 'dimension', 'spacing.base');
    expect(result).toEqual({ value: 2, unit: 'rem' });
  });

  it('throws PARSE_ERROR for dimension missing value', () => {
    expect(() =>
      parseTokenValue({ unit: 'rem' }, 'dimension', 'spacing.base')
    ).toThrow(/spacing\.base/);
  });

  it('throws PARSE_ERROR for dimension missing unit', () => {
    expect(() =>
      parseTokenValue({ value: 2 }, 'dimension', 'spacing.base')
    ).toThrow(/spacing\.base/);
  });

  // Border
  it('parses border object', () => {
    const result = parseTokenValue(
      { width: { value: 1, unit: 'px' }, style: 'solid', color: '#000' },
      'border', 'border.default'
    );
    expect(result).toEqual({ width: { value: 1, unit: 'px' }, style: 'solid', color: '#000' });
  });

  it('throws PARSE_ERROR for border missing width', () => {
    expect(() =>
      parseTokenValue({ style: 'solid', color: '#000' }, 'border', 'border.default')
    ).toThrow(/border\.default/);
  });

  // Shadow
  it('parses shadow object', () => {
    const result = parseTokenValue(
      { offsetX: { value: 0, unit: 'px' }, offsetY: { value: 4, unit: 'px' }, blur: { value: 8, unit: 'px' }, color: '#000' },
      'shadow', 'shadow.md'
    );
    expect(result).toEqual({
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 4, unit: 'px' },
      blur: { value: 8, unit: 'px' },
      color: '#000',
    });
  });

  it('throws PARSE_ERROR for shadow missing offsetX', () => {
    expect(() =>
      parseTokenValue({ offsetY: { value: 4, unit: 'px' }, blur: { value: 8, unit: 'px' }, color: '#000' }, 'shadow', 'shadow.md')
    ).toThrow(/shadow\.md/);
  });

  // Gradient — DTCG: flat array of stop objects, no gradientType
  it('parses gradient as flat array of stops', () => {
    const result = parseTokenValue(
      [{ color: '#fff', position: 0 }, { color: '#000', position: 1 }],
      'gradient', 'gradient.hero'
    );
    expect(result).toEqual([{ color: '#fff', position: 0 }, { color: '#000', position: 1 }]);
  });

  it('throws PARSE_ERROR for gradient that is not an array', () => {
    expect(() =>
      parseTokenValue({ color: '#fff', position: 0 }, 'gradient', 'gradient.hero')
    ).toThrow(/gradient\.hero/);
  });

  it('throws PARSE_ERROR for gradient stop missing color', () => {
    expect(() =>
      parseTokenValue([{ position: 0 }], 'gradient', 'gradient.hero')
    ).toThrow(/gradient\.hero/);
  });

  // Typography
  it('parses typography object', () => {
    const result = parseTokenValue(
      { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400 },
      'typography', 'font.body'
    );
    expect(result).toEqual({ fontFamily: 'Inter', fontSize: '16px', fontWeight: 400 });
  });

  // Transition — DTCG: duration/delay as DurationValue, timingFunction as cubic Bézier [x1,y1,x2,y2]
  it('parses transition object', () => {
    const result = parseTokenValue(
      { duration: { value: 200, unit: 'ms' }, delay: { value: 0, unit: 'ms' }, timingFunction: [0.4, 0, 0.2, 1] },
      'transition', 'transition.fast'
    );
    expect(result).toEqual({
      duration: { value: 200, unit: 'ms' },
      delay: { value: 0, unit: 'ms' },
      timingFunction: [0.4, 0, 0.2, 1],
    });
  });

  it('throws PARSE_ERROR for transition missing duration', () => {
    expect(() =>
      parseTokenValue({ delay: { value: 0, unit: 'ms' }, timingFunction: [0, 0, 1, 1] }, 'transition', 'transition.fast')
    ).toThrow(/transition\.fast/);
  });

  it('throws PARSE_ERROR for transition timingFunction not a 4-element array', () => {
    expect(() =>
      parseTokenValue({ duration: { value: 200, unit: 'ms' }, delay: { value: 0, unit: 'ms' }, timingFunction: 'ease' }, 'transition', 'transition.fast')
    ).toThrow(/transition\.fast/);
  });

  // Unknown type with object value
  it('stores unknown composite type as-is', () => {
    const raw = { foo: 'bar', baz: 42 };
    expect(parseTokenValue(raw, 'cubicBezier', 'easing.bounce')).toEqual(raw);
  });
});
