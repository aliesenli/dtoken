import { describe, it, expect } from 'vitest';
import { parseResolver } from '@/resolver/parser.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir() {
  const dir = join(tmpdir(), `dtt-resolver-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(dir: string, relPath: string, data: unknown): string {
  const full = join(dir, relPath);
  mkdirSync(join(dir, relPath, '..'), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2));
  return full;
}

describe('parseResolver', () => {
  it('returns one ResolvedContext for a resolver with no modifiers', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/color.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: {
        foundation: { sources: [{ $ref: 'tokens/color.json' }] },
      },
      resolutionOrder: [{ $ref: '#/sets/foundation' }],
    });
    const results = await parseResolver(join(dir, 'dtt.resolver.json'));
    expect(results).toHaveLength(1);
    expect(results[0].context).toEqual({});
    expect(results[0].graph.nodes.has('color.brand')).toBe(true);
    rmSync(dir, { recursive: true });
  });

  it('returns one ResolvedContext per context for a single modifier', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'tokens/light.json', {
      color: { bg: { $value: '#ffffff', $type: 'color' } },
    });
    writeJson(dir, 'tokens/dark.json', {
      color: { bg: { $value: '#000000', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { base: { sources: [{ $ref: 'tokens/base.json' }] } },
      modifiers: {
        theme: {
          contexts: {
            light: [{ $ref: 'tokens/light.json' }],
            dark: [{ $ref: 'tokens/dark.json' }],
          },
        },
      },
      resolutionOrder: [
        { $ref: '#/sets/base' },
        { $ref: '#/modifiers/theme' },
      ],
    });
    const results = await parseResolver(join(dir, 'dtt.resolver.json'));
    expect(results).toHaveLength(2);
    const contexts = results.map(r => r.context.theme).sort();
    expect(contexts).toEqual(['dark', 'light']);
    rmSync(dir, { recursive: true });
  });

  it('produces cartesian product for two modifiers', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'tokens/light.json', {
      color: { bg: { $value: '#ffffff', $type: 'color' } },
    });
    writeJson(dir, 'tokens/dark.json', {
      color: { bg: { $value: '#000000', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { base: { sources: [{ $ref: 'tokens/base.json' }] } },
      modifiers: {
        theme: {
          contexts: {
            light: [{ $ref: 'tokens/light.json' }],
            dark: [{ $ref: 'tokens/dark.json' }],
          },
        },
        contrast: {
          contexts: {
            normal: [],
            high: [],
          },
        },
      },
      resolutionOrder: [
        { $ref: '#/sets/base' },
        { $ref: '#/modifiers/theme' },
        { $ref: '#/modifiers/contrast' },
      ],
    });
    const results = await parseResolver(join(dir, 'dtt.resolver.json'));
    expect(results).toHaveLength(4);
    rmSync(dir, { recursive: true });
  });

  it('later sources override earlier ones for the same token path', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', {
      color: { bg: { $value: '#ffffff', $type: 'color' } },
    });
    writeJson(dir, 'tokens/dark.json', {
      color: { bg: { $value: '#000000', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { base: { sources: [{ $ref: 'tokens/base.json' }] } },
      modifiers: {
        theme: {
          contexts: {
            light: [],
            dark: [{ $ref: 'tokens/dark.json' }],
          },
        },
      },
      resolutionOrder: [
        { $ref: '#/sets/base' },
        { $ref: '#/modifiers/theme' },
      ],
    });
    const results = await parseResolver(join(dir, 'dtt.resolver.json'));
    const dark = results.find(r => r.context.theme === 'dark')!;
    const light = results.find(r => r.context.theme === 'light')!;
    expect(dark.graph.nodes.get('color.bg')!.rawValue).toBe('#000000');
    expect(light.graph.nodes.get('color.bg')!.rawValue).toBe('#ffffff');
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for wrong version', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2024.01',
      resolutionOrder: [],
    });
    await expect(parseResolver(join(dir, 'dtt.resolver.json'))).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for missing resolutionOrder', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', { version: '2025.10' });
    await expect(parseResolver(join(dir, 'dtt.resolver.json'))).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for $ref pointing to missing file', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { base: { sources: [{ $ref: 'tokens/missing.json' }] } },
      resolutionOrder: [{ $ref: '#/sets/base' }],
    });
    await expect(parseResolver(join(dir, 'dtt.resolver.json'))).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for unknown JSON pointer in resolutionOrder', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      resolutionOrder: [{ $ref: '#/sets/missing' }],
    });
    await expect(parseResolver(join(dir, 'dtt.resolver.json'))).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
    rmSync(dir, { recursive: true });
  });

  it('produces correct ResolvedContext[] from inline modifier in resolutionOrder', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'tokens/light.json', {
      semantic: { bg: { $value: '#ffffff', $type: 'color' } },
    });
    writeJson(dir, 'tokens/dark.json', {
      semantic: { bg: { $value: '#000000', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      resolutionOrder: [
        {
          type: 'set',
          name: 'base',
          sources: [{ $ref: 'tokens/base.json' }],
        },
        {
          type: 'modifier',
          name: 'theme',
          contexts: {
            light: [{ $ref: 'tokens/light.json' }],
            dark: [{ $ref: 'tokens/dark.json' }],
          },
        },
      ],
    });
    const results = await parseResolver(join(dir, 'dtt.resolver.json'));
    expect(results).toHaveLength(2);
    const light = results.find(r => r.context.theme === 'light')!;
    const dark = results.find(r => r.context.theme === 'dark')!;
    expect(light.graph.nodes.get('color.brand')!.value).toBe('#3b82f6');
    expect(light.graph.nodes.get('semantic.bg')!.value).toBe('#ffffff');
    expect(dark.graph.nodes.get('semantic.bg')!.value).toBe('#000000');
    rmSync(dir, { recursive: true });
  });

  it('includes tokens from set referenced inside modifier context', async () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'tokens/light.json', {
      semantic: { bg: { $value: '#ffffff', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { base: { sources: [{ $ref: 'tokens/base.json' }] } },
      modifiers: {
        theme: {
          contexts: {
            light: [{ $ref: '#/sets/base' }, { $ref: 'tokens/light.json' }],
            dark: [],
          },
        },
      },
      resolutionOrder: [{ $ref: '#/modifiers/theme' }],
    });
    const results = await parseResolver(join(dir, 'dtt.resolver.json'));
    const light = results.find(r => r.context.theme === 'light')!;
    expect(light.graph.nodes.has('color.brand')).toBe(true);
    expect(light.graph.nodes.has('semantic.bg')).toBe(true);
    rmSync(dir, { recursive: true });
  });
});
