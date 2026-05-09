import { describe, it, expectTypeOf } from 'vitest';
import type {
  TokenNode,
  TokenGraph,
  DTTError,
  DTTErrorCode,
  DTTConfig,
  Plugin,
  ConfigContext,
  ValidateContext,
  TransformContext,
  OutputContext,
} from '@/graph/types.js';

describe('core types', () => {
  it('TokenNode has required fields', () => {
    expectTypeOf<TokenNode>().toHaveProperty('path');
    expectTypeOf<TokenNode>().toHaveProperty('value');
    expectTypeOf<TokenNode>().toHaveProperty('type');
    expectTypeOf<TokenNode>().toHaveProperty('rawValue');
  });

  it('TokenGraph has nodes map and order array', () => {
    expectTypeOf<TokenGraph>().toHaveProperty('nodes');
    expectTypeOf<TokenGraph>().toHaveProperty('order');
  });

  it('DTTError has code and message', () => {
    expectTypeOf<DTTError>().toHaveProperty('code');
    expectTypeOf<DTTError>().toHaveProperty('message');
  });
});
