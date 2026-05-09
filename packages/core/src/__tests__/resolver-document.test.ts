import { describe, it, expect } from 'vitest';
import { loadResolverDocument } from '@/resolver/document.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir() {
  const dir = join(tmpdir(), `dtt-doc-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(dir: string, relPath: string, data: unknown): void {
  const full = join(dir, relPath);
  mkdirSync(join(dir, relPath, '..'), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2));
}

describe('loadResolverDocument', () => {
  it('normalizes a $ref set in resolutionOrder', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/color.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { foundation: { sources: [{ $ref: 'tokens/color.json' }] } },
      resolutionOrder: [{ $ref: '#/sets/foundation' }],
    });
    const doc = loadResolverDocument(join(dir, 'dtt.resolver.json'));
    expect(doc.orderItems).toHaveLength(1);
    expect(doc.orderItems[0].type).toBe('set');
    expect((doc.orderItems[0] as { filePaths: string[] }).filePaths).toHaveLength(1);
    rmSync(dir, { recursive: true });
  });

  it('normalizes an inline set in resolutionOrder', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/color.json', {
      color: { brand: { $value: '#3b82f6', $type: 'color' } },
    });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      resolutionOrder: [{
        type: 'set',
        name: 'foundation',
        sources: [{ $ref: 'tokens/color.json' }],
      }],
    });
    const doc = loadResolverDocument(join(dir, 'dtt.resolver.json'));
    expect(doc.orderItems[0].type).toBe('set');
    expect((doc.orderItems[0] as { filePaths: string[] }).filePaths).toHaveLength(1);
    rmSync(dir, { recursive: true });
  });

  it('normalizes an inline modifier in resolutionOrder', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/light.json', { semantic: { bg: { $value: '#fff', $type: 'color' } } });
    writeJson(dir, 'tokens/dark.json', { semantic: { bg: { $value: '#000', $type: 'color' } } });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      resolutionOrder: [{
        type: 'modifier',
        name: 'theme',
        contexts: {
          light: [{ $ref: 'tokens/light.json' }],
          dark: [{ $ref: 'tokens/dark.json' }],
        },
      }],
    });
    const doc = loadResolverDocument(join(dir, 'dtt.resolver.json'));
    expect(doc.orderItems[0].type).toBe('modifier');
    const mod = doc.orderItems[0] as { contexts: Record<string, string[]> };
    expect(mod.contexts['light']).toHaveLength(1);
    expect(mod.contexts['dark']).toHaveLength(1);
    rmSync(dir, { recursive: true });
  });

  it('expands set $ref inside a modifier context (§4.1.5.1)', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', { color: { brand: { $value: '#3b82f6', $type: 'color' } } });
    writeJson(dir, 'tokens/light.json', { semantic: { bg: { $value: '#fff', $type: 'color' } } });
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
    const doc = loadResolverDocument(join(dir, 'dtt.resolver.json'));
    const mod = doc.orderItems[0] as { contexts: Record<string, string[]> };
    expect(mod.contexts['light']).toHaveLength(2);
    rmSync(dir, { recursive: true });
  });

  it('validates default matches a context key — valid case', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/light.json', { semantic: { bg: { $value: '#fff', $type: 'color' } } });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      modifiers: {
        theme: {
          default: 'light',
          contexts: { light: [{ $ref: 'tokens/light.json' }], dark: [] },
        },
      },
      resolutionOrder: [{ $ref: '#/modifiers/theme' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).not.toThrow();
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR when default does not match any context key', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      modifiers: {
        theme: {
          default: 'midnight',
          contexts: { light: [], dark: [] },
        },
      },
      resolutionOrder: [{ $ref: '#/modifiers/theme' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).toThrow();
    try { loadResolverDocument(join(dir, 'dtt.resolver.json')); } catch (e) {
      expect((e as { code: string }).code).toBe('PARSE_ERROR');
    }
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for 0-context modifier', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      modifiers: { theme: { contexts: {} } },
      resolutionOrder: [{ $ref: '#/modifiers/theme' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).toThrow();
    try { loadResolverDocument(join(dir, 'dtt.resolver.json')); } catch (e) {
      expect((e as { code: string }).code).toBe('PARSE_ERROR');
    }
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for duplicate name in resolutionOrder', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/color.json', { color: { brand: { $value: '#3b82f6', $type: 'color' } } });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: { foundation: { sources: [{ $ref: 'tokens/color.json' }] } },
      resolutionOrder: [
        { $ref: '#/sets/foundation' },
        { type: 'set', name: 'foundation', sources: [{ $ref: 'tokens/color.json' }] },
      ],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).toThrow();
    try { loadResolverDocument(join(dir, 'dtt.resolver.json')); } catch (e) {
      expect((e as { code: string }).code).toBe('PARSE_ERROR');
    }
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for inline item missing name', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      resolutionOrder: [{ type: 'set', sources: [] }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).toThrow();
    try { loadResolverDocument(join(dir, 'dtt.resolver.json')); } catch (e) {
      expect((e as { code: string }).code).toBe('PARSE_ERROR');
    }
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR for #/resolutionOrder/... ref', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      resolutionOrder: [{ $ref: '#/resolutionOrder/0' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).toThrow();
    try { loadResolverDocument(join(dir, 'dtt.resolver.json')); } catch (e) {
      expect((e as { code: string }).code).toBe('PARSE_ERROR');
    }
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR when modifier source refs another modifier', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      modifiers: {
        theme: { contexts: { light: [] } },
        size: {
          contexts: {
            sm: [{ $ref: '#/modifiers/theme' }],
          },
        },
      },
      resolutionOrder: [{ $ref: '#/modifiers/size' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).toThrow();
    try { loadResolverDocument(join(dir, 'dtt.resolver.json')); } catch (e) {
      expect((e as { code: string }).code).toBe('PARSE_ERROR');
    }
    rmSync(dir, { recursive: true });
  });

  it('handles $ref with extra keys (extend/override)', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/base.json', { color: { brand: { $value: '#3b82f6', $type: 'color' } } });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: {
        foundation: {
          sources: [{
            $ref: 'tokens/base.json',
            color: { override: { $value: '#ff0000', $type: 'color' } },
          }],
        },
      },
      resolutionOrder: [{ $ref: '#/sets/foundation' }],
    });
    const doc = loadResolverDocument(join(dir, 'dtt.resolver.json'));
    const set = doc.orderItems[0] as { filePaths: string[] };
    expect(set.filePaths).toHaveLength(2);
    expect(set.filePaths[1]).toMatch(/^inline:/);
    rmSync(dir, { recursive: true });
  });

  it('silently ignores $defs at root', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/color.json', { color: { brand: { $value: '#3b82f6', $type: 'color' } } });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      $defs: { 'tokens/color.json': { color: { brand: { $value: '#3b82f6', $type: 'color' } } } },
      sets: { foundation: { sources: [{ $ref: 'tokens/color.json' }] } },
      resolutionOrder: [{ $ref: '#/sets/foundation' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).not.toThrow();
    rmSync(dir, { recursive: true });
  });

  it('silently ignores $extensions on a set', () => {
    const dir = makeTmpDir();
    writeJson(dir, 'tokens/color.json', { color: { brand: { $value: '#3b82f6', $type: 'color' } } });
    writeJson(dir, 'dtt.resolver.json', {
      version: '2025.10',
      sets: {
        foundation: {
          sources: [{ $ref: 'tokens/color.json' }],
          $extensions: { 'figma.com': { sourceFile: 'https://figma.com/file/xxx' } },
        },
      },
      resolutionOrder: [{ $ref: '#/sets/foundation' }],
    });
    expect(() => loadResolverDocument(join(dir, 'dtt.resolver.json'))).not.toThrow();
    rmSync(dir, { recursive: true });
  });
});
