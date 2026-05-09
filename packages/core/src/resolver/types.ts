import type { TokenGraph } from '@/graph/types.js';

export interface ResolverSource {
  $ref: string;
  [key: string]: unknown;
}

export interface ResolverSet {
  description?: string;
  sources: ResolverSource[];
  $extensions?: Record<string, unknown>;
}

export interface ResolverModifier {
  description?: string;
  default?: string;
  contexts: Record<string, ResolverSource[]>;
  $extensions?: Record<string, unknown>;
}

export interface InlineSet {
  type: 'set';
  name: string;
  description?: string;
  sources: ResolverSource[];
  $extensions?: Record<string, unknown>;
}

export interface InlineModifier {
  type: 'modifier';
  name: string;
  description?: string;
  default?: string;
  contexts: Record<string, ResolverSource[]>;
  $extensions?: Record<string, unknown>;
}

export type ResolutionOrderItem = ResolverSource | InlineSet | InlineModifier;

export interface ResolverDocument {
  $schema?: string;
  name?: string;
  version: string;
  description?: string;
  sets?: Record<string, ResolverSet>;
  modifiers?: Record<string, ResolverModifier>;
  resolutionOrder: ResolutionOrderItem[];
  $defs?: Record<string, unknown>;
  $extensions?: Record<string, unknown>;
}

export interface NormalizedSet {
  type: 'set';
  name: string;
  filePaths: string[];
}

export interface NormalizedModifier {
  type: 'modifier';
  name: string;
  contexts: Record<string, string[]>;
}

export type NormalizedOrderItem = NormalizedSet | NormalizedModifier;

export interface ResolvedDocument {
  orderItems: NormalizedOrderItem[];
}

export interface ResolvedContext {
  context: Record<string, string>;
  graph: TokenGraph;
}
