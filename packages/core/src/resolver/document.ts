import { readFileSync, existsSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import type {
  ResolverDocument,
  ResolverSource,
  ResolverSet,
  ResolverModifier,
  ResolutionOrderItem,
  InlineSet,
  InlineModifier,
  NormalizedSet,
  NormalizedModifier,
  NormalizedOrderItem,
  ResolvedDocument,
} from '@/resolver/types.js';

function makeError(message: string, file?: string): Error & { code: 'PARSE_ERROR'; file?: string } {
  return Object.assign(new Error(message), {
    code: 'PARSE_ERROR' as const,
    message,
    file,
  });
}

function isInlineItem(item: ResolutionOrderItem): item is InlineSet | InlineModifier {
  return 'type' in item;
}

function resolveSourcePaths(
  sources: ResolverSource[],
  resolverDir: string,
  resolverPath: string,
  doc: ResolverDocument
): string[] {
  const paths: string[] = [];

  for (const src of sources) {
    const ref = src.$ref;

    if (ref.startsWith('#/modifiers/')) {
      throw makeError(
        `Modifier source cannot reference another modifier "${ref}"`,
        resolverPath
      );
    }

    if (ref.startsWith('#/resolutionOrder/')) {
      throw makeError(
        `Invalid $ref "${ref}" — resolutionOrder items cannot be referenced`,
        resolverPath
      );
    }

    if (ref.startsWith('#/sets/')) {
      const setName = ref.replace('#/sets/', '');
      const set = doc.sets?.[setName];
      if (!set) throw makeError(`Unknown set reference "${ref}"`, resolverPath);
      paths.push(...resolveSourcePaths(set.sources, resolverDir, resolverPath, doc));
      continue;
    }

    if (ref.startsWith('#')) {
      throw makeError(`Invalid $ref "${ref}" — unsupported pointer format`, resolverPath);
    }

    const abs = resolvePath(resolverDir, ref);
    if (!existsSync(abs)) {
      throw makeError(`Referenced file not found: "${abs}"`, resolverPath);
    }
    paths.push(abs);

    const extraKeys = Object.fromEntries(
      Object.entries(src).filter(([k]) => k !== '$ref')
    );
    if (Object.keys(extraKeys).length > 0) {
      paths.push(`inline:${JSON.stringify(extraKeys)}`);
    }
  }

  return paths;
}

function normalizeSet(
  name: string,
  set: ResolverSet | InlineSet,
  resolverDir: string,
  resolverPath: string,
  doc: ResolverDocument
): NormalizedSet {
  return {
    type: 'set',
    name,
    filePaths: resolveSourcePaths(set.sources, resolverDir, resolverPath, doc),
  };
}

function normalizeModifier(
  name: string,
  mod: ResolverModifier | InlineModifier,
  resolverDir: string,
  resolverPath: string,
  doc: ResolverDocument
): NormalizedModifier {
  const ctxKeys = Object.keys(mod.contexts);
  if (ctxKeys.length === 0) {
    throw makeError(`Modifier "${name}" must have at least one context`, resolverPath);
  }
  if (mod.default !== undefined && !mod.contexts[mod.default]) {
    throw makeError(
      `Modifier "${name}" default "${mod.default}" is not a valid context key`,
      resolverPath
    );
  }

  const contexts: Record<string, string[]> = {};
  for (const [ctxName, sources] of Object.entries(mod.contexts)) {
    contexts[ctxName] = resolveSourcePaths(sources, resolverDir, resolverPath, doc);
  }

  return { type: 'modifier', name, contexts };
}

export function loadResolverDocument(resolverPath: string): ResolvedDocument {
  const resolverDir = dirname(resolvePath(resolverPath));

  let doc: ResolverDocument;
  try {
    doc = JSON.parse(readFileSync(resolverPath, 'utf-8')) as ResolverDocument;
  } catch {
    throw makeError(`Failed to parse resolver file "${resolverPath}"`, resolverPath);
  }

  if (doc.version !== '2025.10') {
    throw makeError(
      `Resolver version must be "2025.10", got "${doc.version}"`,
      resolverPath
    );
  }

  if (!Array.isArray(doc.resolutionOrder)) {
    throw makeError(`Resolver file must have a "resolutionOrder" array`, resolverPath);
  }

  for (const [name, mod] of Object.entries(doc.modifiers ?? {})) {
    const ctxKeys = Object.keys(mod.contexts);
    if (ctxKeys.length === 0) {
      throw makeError(`Modifier "${name}" must have at least one context`, resolverPath);
    }
    if (mod.default !== undefined && !mod.contexts[mod.default]) {
      throw makeError(
        `Modifier "${name}" default "${mod.default}" is not a valid context key`,
        resolverPath
      );
    }
  }

  const orderItems: NormalizedOrderItem[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < doc.resolutionOrder.length; i++) {
    const item = doc.resolutionOrder[i];

    if (isInlineItem(item)) {
      if (!item.name) {
        throw makeError(`resolutionOrder item at index ${i} is missing required "name" field`, resolverPath);
      }
      if (!item.type) {
        throw makeError(`resolutionOrder item at index ${i} is missing required "type" field`, resolverPath);
      }
      if (seenNames.has(item.name)) {
        throw makeError(`Duplicate resolutionOrder name "${item.name}"`, resolverPath);
      }
      seenNames.add(item.name);

      if (item.type === 'set') {
        orderItems.push(normalizeSet(item.name, item, resolverDir, resolverPath, doc));
      } else if (item.type === 'modifier') {
        orderItems.push(normalizeModifier(item.name, item, resolverDir, resolverPath, doc));
      } else {
        throw makeError(`Unknown resolutionOrder item type "${(item as { type: string }).type}"`, resolverPath);
      }
    } else {
      const src = item as ResolverSource;
      const ref = src.$ref;

      if (!ref) {
        throw makeError(`resolutionOrder entry at index ${i} is missing a "$ref" field`, resolverPath);
      }

      if (ref.startsWith('#/resolutionOrder/')) {
        throw makeError(
          `Invalid $ref "${ref}" — resolutionOrder items cannot be referenced`,
          resolverPath
        );
      }

      if (ref.startsWith('#/sets/')) {
        const name = ref.replace('#/sets/', '');
        if (!doc.sets?.[name]) throw makeError(`Unknown set reference "${ref}"`, resolverPath);
        if (seenNames.has(name)) throw makeError(`Duplicate resolutionOrder name "${name}"`, resolverPath);
        seenNames.add(name);
        orderItems.push(normalizeSet(name, doc.sets[name], resolverDir, resolverPath, doc));
        continue;
      }

      if (ref.startsWith('#/modifiers/')) {
        const name = ref.replace('#/modifiers/', '');
        if (!doc.modifiers?.[name]) throw makeError(`Unknown modifier reference "${ref}"`, resolverPath);
        if (seenNames.has(name)) throw makeError(`Duplicate resolutionOrder name "${name}"`, resolverPath);
        seenNames.add(name);
        orderItems.push(normalizeModifier(name, doc.modifiers[name], resolverDir, resolverPath, doc));
        continue;
      }

      throw makeError(
        `Invalid $ref "${ref}" in resolutionOrder — only #/sets/... or #/modifiers/... allowed`,
        resolverPath
      );
    }
  }

  return { orderItems };
}
