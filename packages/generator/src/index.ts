import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

type Preset = 'minimal' | 'product-ui' | 'strict' | 'tailwindish';

function writeJson(filePath: string, data: unknown): string {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

export async function generate(preset: Preset, outDir: string): Promise<string[]> {
  switch (preset) {
    case 'minimal': {
      const { minimalTokens, minimalSpacing } = await import('@/minimal.js');
      return [
        writeJson(join(outDir, 'color.json'), minimalTokens),
        writeJson(join(outDir, 'spacing.json'), minimalSpacing),
      ];
    }
    case 'product-ui': {
      const m = await import('@/product-ui.js');
      return [
        writeJson(join(outDir, 'primitive', 'color.json'), m.primitiveColor),
        writeJson(join(outDir, 'primitive', 'spacing.json'), m.primitiveSpacing),
        writeJson(join(outDir, 'semantic', 'color.json'), m.semanticColor),
        writeJson(join(outDir, 'semantic', 'radius.json'), m.semanticRadius),
        writeJson(join(outDir, 'typography.json'), m.typography),
      ];
    }
    case 'strict': {
      const m = await import('@/strict.js');
      return [
        writeJson(join(outDir, 'primitive', 'color.json'), m.primitiveColor),
        writeJson(join(outDir, 'primitive', 'spacing.json'), m.primitiveSpacing),
        writeJson(join(outDir, 'semantic', 'color.json'), m.semanticColor),
        writeJson(join(outDir, 'semantic', 'radius.json'), m.semanticRadius),
        writeJson(join(outDir, 'typography.json'), m.typography),
      ];
    }
    case 'tailwindish': {
      const m = await import('@/tailwindish.js');
      return [
        writeJson(join(outDir, 'color.json'), m.tailwindishColor),
        writeJson(join(outDir, 'spacing.json'), m.tailwindishSpacing),
        writeJson(join(outDir, 'radius.json'), m.tailwindishRadius),
      ];
    }
    default: {
      const _: never = preset;
      throw new Error(`Unknown preset: ${String(_)}`);
    }
  }
}
