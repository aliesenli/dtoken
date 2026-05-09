import { defineConfig } from 'tsup';
import { resolve } from 'node:path';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node18',
  esbuildOptions(options) {
    options.alias = { '@': resolve('./src') };
  },
});
