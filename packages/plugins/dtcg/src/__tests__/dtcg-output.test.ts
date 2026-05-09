import { describe, it, expect } from 'vitest';
import { dtcgOutputPlugin } from '@/dtcg-output.js';
import type { TokenGraph } from '@dtt/core';

function makeGraph(): TokenGraph {
  return {
    nodes: new Map([
      ['color.primary', {
        path: ['color', 'primary'],
        value: '#3b82f6',
        rawValue: '#3b82f6',
        type: 'color',
      }],
      ['color.bg.page', {
        path: ['color', 'bg', 'page'],
        value: '#ffffff',
        rawValue: '#ffffff',
        type: 'color',
        description: 'Main page background',
      }],
      ['spacing.base', {
        path: ['spacing', 'base'],
        value: { value: 1, unit: 'rem' },
        rawValue: '{"value":1,"unit":"rem"}',
        type: 'dimension',
      }],
    ]),
    order: ['color.bg.page', 'color.primary', 'spacing.base'],
  };
}

describe('dtcgOutputPlugin', () => {
  it('writes tokens.dtcg.json to the output dir', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    expect(written).toHaveLength(1);
    expect(written[0].path).toMatch(/tokens\.dtcg\.json$/);
  });

  it('nests tokens by path hierarchy', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed.color).toBeDefined();
    expect(parsed.color.primary).toBeDefined();
    expect(parsed.color.bg).toBeDefined();
    expect(parsed.color.bg.page).toBeDefined();
    expect(parsed.spacing.base).toBeDefined();
  });

  it('writes $value and $type on each leaf', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed.color.primary.$value).toBe('#3b82f6');
    expect(parsed.color.primary.$type).toBe('color');
  });

  it('writes $description only when present', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed.color.bg.page.$description).toBe('Main page background');
    expect(parsed.color.primary.$description).toBeUndefined();
  });

  it('serializes composite values as objects', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed.spacing.base.$value).toEqual({ value: 1, unit: 'rem' });
    expect(parsed.spacing.base.$type).toBe('dimension');
  });

  it('handles deep nesting correctly', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed.color.bg.page.$value).toBe('#ffffff');
  });

  it('output is ordered by graph.order (alphabetical)', () => {
    const written: Array<{ path: string; content: string }> = [];
    dtcgOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    const topLevelKeys = Object.keys(parsed);
    expect(topLevelKeys.indexOf('color')).toBeLessThan(topLevelKeys.indexOf('spacing'));
  });
});
