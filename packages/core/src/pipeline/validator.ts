import type { TokenGraph, DTTError, Plugin, ValidateContext } from '@/graph/types.js';

const KNOWN_TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'number',
  'duration', 'cubicBezier', 'shadow', 'gradient', 'typography', 'border',
  'transition',
]);

export class ValidationError extends Error {
  errors: DTTError[];
  constructor(errors: DTTError[]) {
    super(`DTT: ${errors.length} validation error(s)`);
    this.errors = errors;
  }
}

export function validate(graph: TokenGraph, plugins: Plugin[], strict: boolean): void {
  const errors: DTTError[] = [];

  for (const [key, node] of graph.nodes) {
    if (strict && !node.type) {
      errors.push({
        code: 'SCHEMA_ERROR',
        message: `Token "${key}" is missing $type (required in strict mode)`,
        tokenPath: key,
      });
    } else if (node.type && !KNOWN_TYPES.has(node.type)) {
      errors.push({
        code: 'SCHEMA_ERROR',
        message: `Token "${key}" has unknown $type "${node.type}"`,
        tokenPath: key,
      });
    }
  }

  const ctx: ValidateContext = {
    graph,
    report(err) {
      errors.push(err);
    },
  };

  for (const plugin of plugins) {
    plugin.hooks?.validate?.(ctx);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}
