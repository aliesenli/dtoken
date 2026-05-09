import { describe, it, expect } from 'vitest';
import { parse } from '@/pipeline/parser.js';
import { validate } from '@/pipeline/validator.js';
import { resolve } from '@/pipeline/resolver.js';
import { transform } from '@/pipeline/transformer.js';
import { output } from '@/pipeline/outputter.js';
import type { Plugin } from '@/graph/types.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir() {
  const dir = join(tmpdir(), `dtt-integration-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function capturePlugin(): { plugin: Plugin; written: Array<{ path: string; content: string }> } {
  const written: Array<{ path: string; content: string }> = [];
  const plugin: Plugin = {
    name: 'capture',
    hooks: {
      output({ graph, write }) {
        const result: Record<string, unknown> = {};
        for (const key of graph.order) {
          const node = graph.nodes.get(key)!;
          result[key] = { value: node.value, type: node.type };
        }
        write('tokens.json', JSON.stringify(result));
      },
    },
  };
  return { plugin, written };
}

describe('full pipeline', () => {
  it('resolves references and produces correct output', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'tokens.json'),
      JSON.stringify({
        color: {
          base: { $value: '#3b82f6', $type: 'color' },
          primary: { $value: '{color.base}', $type: 'color' },
        },
      })
    );

    const graph = await parse(dir);
    validate(graph, [], false);
    resolve(graph);
    transform(graph, []);

    const written: Array<{ path: string; content: string }> = [];
    const { plugin } = capturePlugin();
    output(graph, [plugin], (p, c) => written.push({ path: p, content: c }));

    expect(written).toHaveLength(1);
    const result = JSON.parse(written[0].content);
    expect(result['color.primary'].value).toBe('#3b82f6');
    expect(result['color.base'].value).toBe('#3b82f6');

    rmSync(dir, { recursive: true });
  });

  it('fails on missing reference', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'tokens.json'),
      JSON.stringify({
        semantic: {
          bg: { $value: '{color.missing}', $type: 'color' },
        },
      })
    );

    const graph = await parse(dir);
    validate(graph, [], false);
    expect(() => resolve(graph)).toThrow();

    rmSync(dir, { recursive: true });
  });

  it('fails on circular reference', async () => {
    const dir = makeTmpDir();
    writeFileSync(
      join(dir, 'tokens.json'),
      JSON.stringify({
        color: {
          a: { $value: '{color.b}', $type: 'color' },
          b: { $value: '{color.a}', $type: 'color' },
        },
      })
    );

    const graph = await parse(dir);
    validate(graph, [], false);
    expect(() => resolve(graph)).toThrow();

    rmSync(dir, { recursive: true });
  });
});
