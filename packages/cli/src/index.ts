#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import { resolve as resolvePath, dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  parse, validate, resolve, transform, output,
  loadConfig, loadPlugins, parseResolver,
} from '@dtt/core';
import type { DTTError } from '@dtt/core';
import { jsonOutputPlugin } from '@dtt/plugin-json';
import { generate } from '@dtt/generator';

function printErrors(errors: DTTError[]): void {
  process.stderr.write(`\n✖ DTT: ${errors.length} error(s)\n\n`);
  for (const err of errors) {
    const loc = err.tokenPath ? ` ${err.tokenPath}` : '';
    const file = err.file ? ` (file: ${err.file})` : '';
    process.stderr.write(`  [${err.code}]${loc} — ${err.message}${file}\n`);
  }
  process.stderr.write('\n');
}

function handleError(err: unknown): never {
  const e = err as DTTError & Error & { errors?: DTTError[] };
  if (e.errors) {
    printErrors(e.errors);
  } else {
    process.stderr.write(`\n✖ DTT: ${e.message}\n\n`);
  }
  process.exit(1);
}

const validateCmd = defineCommand({
  meta: { name: 'validate', description: 'Validate token files' },
  args: {
    input: { type: 'positional', description: 'Path to token files', required: true },
    config: { type: 'string', default: './dtt.config.ts', description: 'Config file path' },
    strict: { type: 'boolean', default: false, description: 'Enable strict mode' },
  },
  async run({ args }) {
    try {
      const configPath = resolvePath(args.config);
      const config = await loadConfig(configPath);
      const strict = args.strict || config.strict;
      const plugins = await loadPlugins(config.plugins, dirname(configPath));
      const graph = await parse(args.input);
      validate(graph, plugins, strict);
      resolve(graph);
      process.stdout.write('✔ DTT: tokens are valid\n');
    } catch (err) {
      handleError(err);
    }
  },
});

const buildCmd = defineCommand({
  meta: { name: 'build', description: 'Build token files' },
  args: {
    input: { type: 'positional', description: 'Path to token files or .resolver.json', required: true },
    out: { type: 'string', default: './dist/tokens', description: 'Output directory' },
    config: { type: 'string', default: './dtt.config.ts', description: 'Config file path' },
    strict: { type: 'boolean', default: false, description: 'Enable strict mode' },
  },
  async run({ args }) {
    try {
      const configPath = resolvePath(args.config);
      const config = await loadConfig(configPath);
      const strict = args.strict || config.strict;
      const outDir = args.out || config.output;
      const plugins = await loadPlugins(config.plugins, dirname(configPath));

      const isResolver = args.input.endsWith('.resolver.json');

      if (isResolver) {
        const contexts = await parseResolver(resolvePath(args.input));

        for (const { context, graph } of contexts) {
          const subDir = Object.entries(context)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('/');
          const contextOutDir = subDir ? join(outDir, subDir) : outDir;
          const contextLabel = subDir ? ` [${subDir.replaceAll('/', ', ')}]` : '';

          validate(graph, plugins, strict);
          resolve(graph);
          transform(graph, plugins);

          mkdirSync(contextOutDir, { recursive: true });
          output(
            graph,
            [...plugins, jsonOutputPlugin(contextOutDir)],
            (filePath, content) => {
              mkdirSync(dirname(filePath), { recursive: true });
              writeFileSync(filePath, content, 'utf-8');
            }
          );

          process.stdout.write(`✔ DTT${contextLabel}: tokens built to ${contextOutDir}\n`);
        }
      } else {
        const graph = await parse(args.input);
        validate(graph, plugins, strict);
        resolve(graph);
        transform(graph, plugins);

        mkdirSync(outDir, { recursive: true });
        output(
          graph,
          [...plugins, jsonOutputPlugin(outDir)],
          (filePath, content) => {
            mkdirSync(dirname(filePath), { recursive: true });
            writeFileSync(filePath, content, 'utf-8');
          }
        );

        process.stdout.write(`✔ DTT: tokens built to ${outDir}\n`);
      }
    } catch (err) {
      handleError(err);
    }
  },
});

const initCmd = defineCommand({
  meta: { name: 'init', description: 'Generate starter token files' },
  args: {
    preset: { type: 'string', default: 'minimal', description: 'Preset (minimal | product-ui | strict | tailwindish)' },
    out: { type: 'string', default: './tokens', description: 'Output directory' },
  },
  async run({ args }) {
    try {
      const files = await generate(args.preset as never, args.out);
      process.stdout.write(`✔ DTT: generated ${files.length} file(s) to ${args.out}\n`);
      for (const f of files) process.stdout.write(`  ${f}\n`);
    } catch (err) {
      handleError(err);
    }
  },
});

const main = defineCommand({
  meta: { name: 'dtt', description: 'Design Token Transformer' },
  subCommands: { validate: validateCmd, build: buildCmd, init: initCmd },
});

runMain(main);
