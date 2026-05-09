import { describe, it, expect } from 'vitest';
import { serializeToCSS } from '@/css-serializer.js';

describe('serializeToCSS', () => {
  it('serializes scalar string color', () => {
    expect(serializeToCSS('--color-primary', '#3b82f6', 'color')).toEqual(['--color-primary: #3b82f6;']);
  });

  it('serializes scalar number fontWeight', () => {
    expect(serializeToCSS('--font-weight-bold', 700, 'fontWeight')).toEqual(['--font-weight-bold: 700;']);
  });

  it('serializes sRGB color to rgb()', () => {
    const result = serializeToCSS('--color-primary', { colorSpace: 'srgb', components: [0, 0.502, 1] }, 'color');
    expect(result).toEqual(['--color-primary: rgb(0, 128, 255);']);
  });

  it('serializes sRGB color with alpha', () => {
    const result = serializeToCSS('--color-overlay', { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }, 'color');
    expect(result).toEqual(['--color-overlay: rgb(0 0 0 / 0.5);']);
  });

  it('serializes oklch color', () => {
    const result = serializeToCSS('--color-primary', { colorSpace: 'oklch', components: [0.7, 0.15, 180] }, 'color');
    expect(result).toEqual(['--color-primary: oklch(0.7 0.15 180);']);
  });

  it('serializes display-p3 using color() function', () => {
    const result = serializeToCSS('--color-primary', { colorSpace: 'display-p3', components: [0.1, 0.5, 0.9] }, 'color');
    expect(result).toEqual(['--color-primary: color(display-p3 0.1 0.5 0.9);']);
  });

  it('serializes dimension object', () => {
    expect(serializeToCSS('--spacing-base', { value: 2, unit: 'rem' }, 'dimension')).toEqual(['--spacing-base: 2rem;']);
  });

  it('serializes border composite', () => {
    const result = serializeToCSS('--border-default', {
      width: { value: 1, unit: 'px' }, style: 'solid', color: '#3b82f6',
    }, 'border');
    expect(result).toEqual(['--border-default: 1px solid #3b82f6;']);
  });

  it('serializes shadow composite', () => {
    const result = serializeToCSS('--shadow-md', {
      offsetX: { value: 0, unit: 'px' }, offsetY: { value: 4, unit: 'px' },
      blur: { value: 8, unit: 'px' }, color: '#000',
    }, 'shadow');
    expect(result).toEqual(['--shadow-md: 0px 4px 8px #000;']);
  });

  it('serializes linear gradient', () => {
    // DTCG: gradient $value is a flat array of stops — serialized as linear-gradient
    const result = serializeToCSS('--gradient-hero',
      [{ color: '#fff', position: 0 }, { color: '#000', position: 1 }],
      'gradient'
    );
    expect(result).toEqual(['--gradient-hero: linear-gradient(#fff 0%, #000 100%);']);
  });

  it('decomposes typography into multiple variables', () => {
    const result = serializeToCSS('--font-body', {
      fontFamily: 'Inter', fontSize: '16px', fontWeight: 400,
    }, 'typography');
    expect(result).toContain('--font-body-family: Inter;');
    expect(result).toContain('--font-body-size: 16px;');
    expect(result).toContain('--font-body-weight: 400;');
  });

  it('serializes transition composite', () => {
    // DTCG: duration/delay as DurationValue, timingFunction as cubic Bézier [x1,y1,x2,y2]
    const result = serializeToCSS('--transition-fast', {
      duration: { value: 150, unit: 'ms' },
      delay: { value: 0, unit: 'ms' },
      timingFunction: [0.4, 0, 0.2, 1],
    }, 'transition');
    expect(result).toEqual(['--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;']);
  });

  it('uses [composite] fallback for unknown type', () => {
    const result = serializeToCSS('--easing', { x1: 0.5, y1: 0, x2: 1, y2: 0.5 }, 'cubicBezier');
    expect(result).toEqual(['--easing: [composite];']);
  });
});
