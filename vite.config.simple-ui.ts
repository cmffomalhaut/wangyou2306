import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import { resolve } from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    vue(),
    yaml(),
    viteSingleFile(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@util/mvu': resolve(__dirname, 'src/util/mvu.ts'),
      'async-wait-until': resolve(__dirname, 'src/util/wait-until.ts'),
    },
  },
  root: resolve(__dirname, 'src/simple_card/界面'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist-local/simple_card/界面'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'iife',
        globals: {
          'vue': 'Vue',
          'pinia': 'Pinia',
          'lodash': '_',
        },
      },
      external: (id) => {
        if (/^https?:\/\//.test(id)) return true;
        if (id === 'vue' || id === 'pinia' || id === 'lodash') return true;
        return false;
      },
    },
  },
});
