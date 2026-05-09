/**
 * Example build script — runs the full DTT pipeline with all features:
 *   - Resolver with 2 modifiers × 2 contexts = 4 permutations
 *   - Reference resolution across primitives → semantic → composite
 *   - Composite value types (border, shadow, gradient, typography, transition)
 *   - JSON + CSS + DTCG output per context
 *
 * Usage: node examples/build.mjs
 * Output: examples/dist/{contrast=high,normal}/{theme=dark,light}/tokens.{json,css,dtcg.json}
 */

import {
  parseResolver,
  validate,
  resolve,
  transform,
  output,
} from '../packages/core/dist/index.js';
import { jsonOutputPlugin } from '../packages/plugins/json/dist/index.js';
import { cssOutputPlugin } from '../packages/plugins/css/dist/index.js';
import { dtcgOutputPlugin } from '../packages/plugins/dtcg/dist/index.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const resolverPath = new URL('./dtt.resolver.json', import.meta.url).pathname;
const outBase = new URL('./dist', import.meta.url).pathname;

console.log('DTT Example Build\n');

const contexts = await parseResolver(resolverPath);

console.log(`Resolver produced ${contexts.length} permutations:\n`);

for (const { context, graph } of contexts) {
  const subDir = Object.entries(context)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('/');
  const outDir = join(outBase, subDir);
  const label = subDir.replaceAll('/', ', ');

  validate(graph, [], false);
  resolve(graph);
  transform(graph, []);

  output(graph, [jsonOutputPlugin(outDir), cssOutputPlugin(outDir), dtcgOutputPlugin(outDir)], (path, content) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf-8');
  });

  const tokenCount = graph.nodes.size;
  console.log(`  [${label}] → ${outDir}`);
  console.log(`    ${tokenCount} tokens → tokens.json + tokens.css + tokens.dtcg.json\n`);
}

console.log('Done.');
