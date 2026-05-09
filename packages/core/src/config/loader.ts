import { existsSync } from 'node:fs';
import type { DTTConfig, DTTError } from '@/graph/types.js';

const DEFAULTS: Required<DTTConfig> = {
  plugins: [],
  output: './dist/tokens',
  strict: false,
};

export async function loadConfig(configPath: string): Promise<Required<DTTConfig>> {
  if (!existsSync(configPath)) {
    return { ...DEFAULTS };
  }

  try {
    const { createJiti } = await import('jiti');
    const jiti = createJiti(configPath);
    const mod = await jiti.import(configPath);
    const userConfig = (mod as { default?: DTTConfig }).default ?? (mod as DTTConfig);
    return { ...DEFAULTS, ...userConfig, plugins: userConfig.plugins ?? [] };
  } catch (err) {
    const error: DTTError & Error = Object.assign(new Error(String(err)), {
      code: 'CONFIG_ERROR' as const,
      message: `Failed to load config at ${configPath}: ${String(err)}`,
    });
    throw error;
  }
}
