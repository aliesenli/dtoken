import { describe, it, expect } from 'vitest';
import { generate } from '@/index.js';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('generate', () => {
  it('minimal preset writes color.json and spacing.json', async () => {
    const out = join(tmpdir(), `dtt-gen-${Date.now()}`);
    const files = await generate('minimal', out);
    expect(files.some(f => f.endsWith('color.json'))).toBe(true);
    expect(files.some(f => f.endsWith('spacing.json'))).toBe(true);
    rmSync(out, { recursive: true });
  });

  it('product-ui preset writes primitive/color.json and semantic/color.json', async () => {
    const out = join(tmpdir(), `dtt-gen-${Date.now()}`);
    const files = await generate('product-ui', out);
    expect(files.some(f => f.includes('primitive') && f.endsWith('color.json'))).toBe(true);
    expect(files.some(f => f.includes('semantic') && f.endsWith('color.json'))).toBe(true);
    rmSync(out, { recursive: true });
  });

  it('strict preset semantic tokens contain only references', async () => {
    const out = join(tmpdir(), `dtt-gen-${Date.now()}`);
    await generate('strict', out);
    const { readFileSync } = await import('node:fs');
    const semanticColor = JSON.parse(
      readFileSync(join(out, 'semantic', 'color.json'), 'utf-8')
    ) as Record<string, Record<string, { $value: string }>>;
    for (const group of Object.values(semanticColor)) {
      for (const token of Object.values(group)) {
        expect(token.$value).toMatch(/^\{.+\}$/);
      }
    }
    rmSync(out, { recursive: true });
  });

  it('tailwindish preset writes color.json with numeric scale', async () => {
    const out = join(tmpdir(), `dtt-gen-${Date.now()}`);
    await generate('tailwindish', out);
    const { readFileSync } = await import('node:fs');
    const colorFile = JSON.parse(readFileSync(join(out, 'color.json'), 'utf-8')) as Record<string, unknown>;
    expect(colorFile).toHaveProperty('color');
    rmSync(out, { recursive: true });
  });

  it('throws for unknown preset', async () => {
    await expect(generate('unknown' as never, '/tmp')).rejects.toThrow();
  });
});
