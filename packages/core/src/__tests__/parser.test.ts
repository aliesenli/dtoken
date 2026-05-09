import { describe, it, expect } from 'vitest';
import { parse } from '@/pipeline/parser.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir() {
  const dir = join(tmpdir(), `dtt-parser-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('parse', () => {
  it('parses a single token file into a TokenGraph', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'color.json'),
      JSON.stringify({
        color: {
          primary: { $value: '#ff0000', $type: 'color' },
        },
      })
    );
    const graph = await parse(dir);
    expect(graph.nodes.has('color.primary')).toBe(true);
    const node = graph.nodes.get('color.primary')!;
    expect(node.rawValue).toBe('#ff0000');
    expect(node.type).toBe('color');
    expect(node.path).toEqual(['color', 'primary']);
    rmSync(dir, { recursive: true });
  });

  it('parses nested token groups', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'spacing.json'),
      JSON.stringify({
        spacing: {
          xs: { $value: '4px', $type: 'dimension' },
          sm: { $value: '8px', $type: 'dimension' },
        },
      })
    );
    const graph = await parse(dir);
    expect(graph.nodes.has('spacing.xs')).toBe(true);
    expect(graph.nodes.has('spacing.sm')).toBe(true);
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR when $value is missing', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'bad.json'),
      JSON.stringify({
        color: { primary: { $type: 'color' } },
      })
    );
    await expect(parse(dir)).rejects.toMatchObject({ code: 'PARSE_ERROR' });
    rmSync(dir, { recursive: true });
  });

  it('throws PARSE_ERROR on malformed JSON', async () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'bad.json'), '{{{');
    await expect(parse(dir)).rejects.toMatchObject({ code: 'PARSE_ERROR' });
    rmSync(dir, { recursive: true });
  });

  it('sets order to stable alphabetical token paths', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'tokens.json'),
      JSON.stringify({
        color: {
          secondary: { $value: '#0000ff', $type: 'color' },
          primary: { $value: '#ff0000', $type: 'color' },
        },
      })
    );
    const graph = await parse(dir);
    expect(graph.order).toEqual(['color.primary', 'color.secondary']);
    rmSync(dir, { recursive: true });
  });
});
