import { describe, it, expect } from 'vitest';
import { jsonOutputPlugin } from '@/json-output.js';
import type { TokenGraph } from '@dtt/core';

function makeGraph(): TokenGraph {
  return {
    nodes: new Map([
      ['color.primary', { path: ['color', 'primary'], value: '#ff0000', rawValue: '#ff0000', type: 'color' }],
      ['spacing.xs', { path: ['spacing', 'xs'], value: '4px', rawValue: '4px', type: 'dimension' }],
    ]),
    order: ['color.primary', 'spacing.xs'],
  };
}

describe('jsonOutputPlugin', () => {
  it('writes tokens.json to the output dir', () => {
    const written: Array<{ path: string; content: string }> = [];
    const plugin = jsonOutputPlugin('./dist/tokens');
    plugin.hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    expect(written).toHaveLength(1);
    expect(written[0].path).toMatch(/tokens\.json$/);
  });

  it('writes deterministically ordered JSON', () => {
    const written: Array<{ path: string; content: string }> = [];
    jsonOutputPlugin('./dist').hooks!.output!({
      graph: makeGraph(),
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(Object.keys(parsed)[0]).toBe('color.primary');
    expect(parsed['color.primary'].value).toBe('#ff0000');
    expect(parsed['spacing.xs'].value).toBe('4px');
  });

  it('includes description when present', () => {
    const graph: TokenGraph = {
      nodes: new Map([
        ['color.brand', { path: ['color', 'brand'], value: '#3b82f6', rawValue: '#3b82f6', type: 'color', description: 'Primary brand color' }],
      ]),
      order: ['color.brand'],
    };
    const written: Array<{ path: string; content: string }> = [];
    jsonOutputPlugin('./dist').hooks!.output!({
      graph,
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed['color.brand'].description).toBe('Primary brand color');
  });

  it('serializes composite values as objects', () => {
    const graph: TokenGraph = {
      nodes: new Map([
        ['spacing.base', { path: ['spacing', 'base'], value: { value: 2, unit: 'rem' }, rawValue: '{"value":2,"unit":"rem"}', type: 'dimension' }],
      ]),
      order: ['spacing.base'],
    };
    const written: Array<{ path: string; content: string }> = [];
    jsonOutputPlugin('./dist').hooks!.output!({
      graph,
      write: (p, c) => written.push({ path: p, content: c }),
    });
    const parsed = JSON.parse(written[0].content);
    expect(parsed['spacing.base'].value).toEqual({ value: 2, unit: 'rem' });
  });
});
