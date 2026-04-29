import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import { resolve } from 'path';

function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    writeBundle(opts, bundle) {
      const fs = require('fs');
      const path = require('path');
      const outDir = opts.dir!;
      let css = '';
      for (const [key, chunk] of Object.entries(bundle)) {
        if (key.endsWith('.css') && chunk.type === 'asset') {
          css = chunk.source as string;
          fs.unlinkSync(path.join(outDir, key));
        }
      }
      if (!css) return;
      const jsFile = path.join(outDir, 'jm_index.js');
      const js = fs.readFileSync(jsFile, 'utf-8');
      const inject = `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})();`;
      fs.writeFileSync(jsFile, inject + js);
    },
  };
}

export default defineConfig({
  plugins: [vue(), yaml(), inlineCss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@util/mvu': resolve(__dirname, 'src/util/mvu.ts'),
      'async-wait-until': resolve(__dirname, 'src/util/wait-until.ts'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist-local/simple_card'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/simple_card/界面入口/panel_loader.ts'),
      name: 'BattlePanel',
      fileName: () => 'jm_index.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: (id) => /^https?:\/\//.test(id),
    },
  },
});
