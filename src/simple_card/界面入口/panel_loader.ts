// ═══════════════════════════════════════════════════════════════
//  战斗面板入口 —— 独立酒馆助手脚本
//
//  注册按钮"打开战斗面板"，点击后加载 Vue 浮动面板。
//  CDN 部署后，此脚本作为独立入口被角色卡引用。
// ═══════════════════════════════════════════════════════════════

// CDN 上的 Vue UI 构建产物（viteSingleFile 打包为单 HTML）
const UI_HTML_URL =
  'https://testingcf.jsdelivr.net/gh/cmffomalhaut/wangyou2306@main/dist-local/simple_card/界面/index.html';

let injectDone = false;

async function injectUI(): Promise<void> {
  if (injectDone) return;

  const res = await fetch(UI_HTML_URL);
  if (!res.ok) throw new Error(`加载战斗面板失败: ${res.status}`);
  const html = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 注入样式
  for (const style of doc.querySelectorAll('style')) {
    document.head.appendChild(style.cloneNode(true));
  }

  // 注入 body 内容（包含 #battle-panel-root 挂载点）
  const wrapper = document.createElement('div');
  wrapper.innerHTML = doc.body.innerHTML;
  document.body.appendChild(wrapper);

  // 执行内联脚本（Vue 应用挂载）
  // 注意：内联脚本是 IIFE 格式，引用 window.Vue / window.Pinia / window._
  // 不能使用 type="module"，否则无法访问全局变量
  for (const script of doc.querySelectorAll('script')) {
    const s = document.createElement('script');
    if (script.src) {
      s.src = script.src;
      if (script.type) s.type = script.type;
    } else {
      s.textContent = script.textContent;
    }
    document.body.appendChild(s);
  }

  injectDone = true;
}

async function openPanel(): Promise<void> {
  const overlay = document.querySelector('.battle-panel-overlay') as HTMLElement | null;
  if (overlay) {
    overlay.style.display = '';
    return;
  }

  await injectUI();
}

$(() => {
  eventOn(getButtonEvent('打开战斗面板'), async () => {
    await openPanel();
  });
});
