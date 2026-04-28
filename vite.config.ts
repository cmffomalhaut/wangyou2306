import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    yaml(),
    {
      name: 'inject-lodash-global',
      transform(code, id) {
        if (id.includes('node_modules')) return;
        if (!id.endsWith('.ts') && !id.endsWith('.vue')) return;
        return `import _lodash from 'lodash';\nif (typeof _ === 'undefined') { var _ = _lodash; }\n` + code;
      },
    },
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  root: 'src/wangyou/界面/战斗测试',
  build: {
    outDir: resolve(__dirname, 'dist/战斗测试'),
  },
});
