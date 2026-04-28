const fs = require('fs');
const path = require('path');
const vm = require('vm');

const inputPath = 'C:/Users/blsmd/Downloads/tavern_helper_template-main/src/酒馆助手脚本-记忆插件.json';
const outputDir = 'C:/Users/blsmd/Downloads/tavern_helper_template-main/src/酒馆助手脚本-记忆插件_反打包';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function findMatchingBrace(text, startIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === '\n' || ch === '\r') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{') {
      depth++;
      continue;
    }

    if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }

  throw new Error('Unable to find matching brace.');
}

function extractModules(bundle) {
  const marker = 'var r=';
  const start = bundle.indexOf(marker);
  if (start === -1) throw new Error('Webpack module table not found.');

  const objectStart = bundle.indexOf('{', start);
  const objectEnd = findMatchingBrace(bundle, objectStart);
  const source = '(' + bundle.slice(objectStart, objectEnd + 1) + ')';
  return vm.runInNewContext(source);
}

function toModuleSource(id, fn) {
  const raw = fn.toString();
  const openParen = raw.indexOf('(');
  if (openParen === -1) {
    return 'module.exports = ' + raw + ';\n';
  }
  return 'module.exports = function' + raw.slice(openParen) + ';\n';
}

function extractSourceMapName(bundle) {
  const match = bundle.match(/[#@]\s*sourceMappingURL=([^\s]+)/);
  return match ? match[1] : null;
}

function sanitizeRelativePath(filePath) {
  let normalized = filePath.replace(/^webpack:\/\//, '');
  normalized = normalized.replace(/^\.\//, '');
  normalized = normalized.replace(/^src\//, 'src/');
  normalized = normalized.replace(/^\//, '');
  return normalized.split('/').join(path.sep);
}

function extractOriginalSources(modules, outputDir) {
  const restoredDir = path.join(outputDir, 'restored-src');
  ensureDir(restoredDir);
  const restored = [];
  const seen = new Map();

  for (const [id, fn] of Object.entries(modules)) {
    const text = fn.toString();
    const regex = /sources:\s*(\[[\s\S]*?\])\s*,\s*names:\s*(\[[\s\S]*?\])\s*,\s*mappings:\s*(['"`][\s\S]*?['"`])\s*,\s*sourcesContent:\s*(\[[\s\S]*?\])/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const sources = vm.runInNewContext(match[1]);
      const sourcesContent = vm.runInNewContext(match[4]);

      for (let i = 0; i < sources.length; i++) {
        const sourceName = sources[i];
        const sourceContent = sourcesContent[i];
        if (typeof sourceName !== 'string' || typeof sourceContent !== 'string') continue;

        const relativePath = sanitizeRelativePath(sourceName);
        const targetPath = path.join(restoredDir, relativePath);
        const previous = seen.get(targetPath);
        if (previous === sourceContent) continue;
        if (previous && previous !== sourceContent) continue;

        ensureDir(path.dirname(targetPath));
        fs.writeFileSync(targetPath, sourceContent, 'utf8');
        seen.set(targetPath, sourceContent);
        restored.push({ moduleId: Number(id), source: sourceName, file: path.relative(outputDir, targetPath).split(path.sep).join('/') });
      }
    }
  }

  return restored;
}

function main() {
  ensureDir(outputDir);
  ensureDir(path.join(outputDir, 'modules'));

  const rawJson = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(rawJson);
  const bundle = parsed.content;
  const modules = extractModules(bundle);
  const restoredSources = extractOriginalSources(modules, outputDir);

  fs.writeFileSync(path.join(outputDir, 'bundle.js'), bundle, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'plugin-meta.json'), JSON.stringify({
    type: parsed.type,
    enabled: parsed.enabled,
    name: parsed.name,
    id: parsed.id,
    info: parsed.info,
    button: parsed.button,
    data: parsed.data,
  }, null, 2), 'utf8');

  const moduleIndex = [];
  for (const id of Object.keys(modules).sort((a, b) => Number(a) - Number(b))) {
    const fn = modules[id];
    const fileName = path.join(outputDir, 'modules', id + '.js');
    fs.writeFileSync(fileName, toModuleSource(id, fn), 'utf8');
    moduleIndex.push({ id: Number(id), file: 'modules/' + id + '.js' });
  }

  const sourceMapName = extractSourceMapName(bundle);
  const readme = [
    '# 酒馆助手脚本-记忆插件 反打包结果',
    '',
    '- 原始入口脚本: `bundle.js`',
    '- 模块拆分目录: `modules/`',
    '- 尝试还原的源码目录: `restored-src/`',
    '- 插件元信息: `plugin-meta.json`',
    '- 模块索引: `modules.json`',
    '- 还原源码索引: `restored-sources.json`',
    '',
    '说明:',
    '- 这个 JSON 是单文件打包产物，但部分模块内嵌了 `sources` 和 `sourcesContent`。',
    '- 已将可提取的原始源码尽量恢复到 `restored-src/`。',
    '- 若某些模块没有内嵌源码，则只能保留为 `modules/` 中的 webpack 模块函数。',
    '- 原包末尾 `sourceMappingURL`: `' + (sourceMapName || '未找到') + '`。',
    '- 本次恢复出的源码文件数: `' + restoredSources.length + '`。',
  ].join('\n');

  fs.writeFileSync(path.join(outputDir, 'modules.json'), JSON.stringify(moduleIndex, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'restored-sources.json'), JSON.stringify(restoredSources, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme, 'utf8');
}

main();
