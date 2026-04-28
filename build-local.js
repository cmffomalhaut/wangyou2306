import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import { resolve } from 'path';

const __dirname = import.meta.dirname;

const shared = {
  plugins: [vue(), yaml()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@util/mvu': resolve(__dirname, 'src/util/mvu.ts'),
      'async-wait-until': resolve(__dirname, 'src/util/wait-until.ts'),
      // Redirect lodash imports to a shim that re-exports window._
      // The tavern helper iframe doesn't provide an import map for bare module specifiers.
      'lodash': resolve(__dirname, 'src/util/lodash-shim.ts'),
    },
  },
};

const entries = [
  { input: 'src/wangyou/脚本/MVU/index.ts', name: '脚本/MVU/index', outDir: 'dist-local/wangyou' },
  { input: 'src/wangyou/脚本/变量结构/index.ts', name: '脚本/变量结构/index', outDir: 'dist-local/wangyou' },
  { input: 'src/wangyou/脚本/战斗系统/index.ts', name: '脚本/战斗系统/index', outDir: 'dist-local/wangyou' },
  { input: 'src/simple_card/mvu_schema.ts', name: '变量结构/index', outDir: 'dist-local/simple_card' },
  { input: 'src/simple_card/battle_index.ts', name: '战斗系统/index', outDir: 'dist-local/simple_card' },
  { input: 'src/simple_card/界面入口/panel_loader.ts', name: '界面入口/index', outDir: 'dist-local/simple_card' },
];

for (const { input, name, outDir } of entries) {
  await build({
    ...shared,
    build: {
      outDir: resolve(__dirname, outDir),
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, input),
        output: {
          format: 'es',
          entryFileNames: `${name}.js`,
        },
        external: (id) => {
          if (/^https?:\/\//.test(id)) return true;
          return false;
        },
      },
    },
  });
  console.log(`Built: ${name}.js`);
}
