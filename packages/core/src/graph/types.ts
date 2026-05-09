import type { TokenValue } from '@/graph/values.js';

export type DTTErrorCode =
  | 'PARSE_ERROR'
  | 'SCHEMA_ERROR'
  | 'MISSING_REFERENCE'
  | 'CIRCULAR_REFERENCE'
  | 'PLUGIN_ERROR'
  | 'CONFIG_ERROR';

export interface DTTError {
  code: DTTErrorCode;
  message: string;
  tokenPath?: string;
  file?: string;
}

export interface TokenNode {
  path: string[];
  value: TokenValue;
  type: string;
  description?: string;
  rawValue: string;
}

export interface TokenGraph {
  nodes: Map<string, TokenNode>;
  order: string[];
}

export interface DTTConfig {
  plugins?: string[];
  output?: string;
  strict?: boolean;
}

export interface ConfigContext {
  config: Readonly<DTTConfig>;
}

export interface ValidateContext {
  graph: Readonly<TokenGraph>;
  report(err: DTTError): void;
}

export interface TransformContext {
  graph: TokenGraph;
}

export interface OutputContext {
  graph: Readonly<TokenGraph>;
  write(path: string, content: string): void;
}

export interface Plugin {
  name: string;
  hooks?: {
    config?(ctx: ConfigContext): void;
    validate?(ctx: ValidateContext): void;
    transform?(ctx: TransformContext): void;
    output?(ctx: OutputContext): void;
  };
}
