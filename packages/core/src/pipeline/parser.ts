import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { TokenGraph, TokenNode, DTTError } from '@/graph/types.js';
import { flattenInto } from '@/graph/flattener.js';

function makeError(message: string, file?: string): DTTError & Error {
  return Object.assign(new Error(message), {
    code: 'PARSE_ERROR' as const,
    message,
    file,
  });
}

function collectJsonFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(full));
    } else if (extname(entry.name) === '.json') {
      files.push(full);
    }
  }
  return files;
}

export async function parse(inputPath: string): Promise<TokenGraph> {
  const stat = statSync(inputPath);
  const files = stat.isDirectory() ? collectJsonFiles(inputPath) : [inputPath];

  const nodes = new Map<string, TokenNode>();

  for (const file of files) {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(readFileSync(file, 'utf-8')) as Record<string, unknown>;
    } catch {
      throw makeError(`Failed to parse JSON in "${file}"`, file);
    }
    flattenInto(raw, [], file, nodes);
  }

  const order = [...nodes.keys()].sort();
  return { nodes, order };
}
