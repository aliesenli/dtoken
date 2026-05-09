import type { TokenNode } from '@/graph/types.js';
import { parseTokenValue } from '@/graph/value-parser.js';

function makeError(message: string, file?: string): Error & { code: 'PARSE_ERROR'; file?: string } {
  return Object.assign(new Error(message), { code: 'PARSE_ERROR' as const, message, file });
}

export function flattenInto(
  obj: Record<string, unknown>,
  pathPrefix: string[],
  file: string,
  nodes: Map<string, TokenNode>
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const currentPath = [...pathPrefix, key];
    const pathStr = currentPath.join('.');

    if (typeof value !== 'object' || value === null) {
      throw makeError(`Token at "${pathStr}" is not an object`, file);
    }

    const node = value as Record<string, unknown>;

    if ('$value' in node) {
      if (node.$value === undefined || node.$value === null) {
        throw makeError(`Token "${pathStr}" has null or undefined $value`, file);
      }
      const type = typeof node.$type === 'string' ? node.$type : '';
      const parsed = parseTokenValue(node.$value, type, pathStr);
      const rawValue = typeof node.$value === 'object'
        ? JSON.stringify(node.$value)
        : String(node.$value);
      nodes.set(pathStr, {
        path: currentPath,
        value: parsed,
        rawValue,
        type,
        description: typeof node.$description === 'string' ? node.$description : undefined,
      });
    } else if (Object.keys(node).some(k => k.startsWith('$'))) {
      throw makeError(`Token "${pathStr}" is missing required $value`, file);
    } else {
      flattenInto(node as Record<string, unknown>, currentPath, file, nodes);
    }
  }
}
