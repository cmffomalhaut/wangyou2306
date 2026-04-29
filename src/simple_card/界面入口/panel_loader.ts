// ═══════════════════════════════════════════════════════════════
//  战斗面板入口 —— 独立酒馆助手脚本
//
//  注册按钮"打开战斗面板"，点击后加载 Vue 浮动面板。
//  CDN 部署后，此脚本作为独立入口被角色卡引用。
// ═══════════════════════════════════════════════════════════════

const UI_HTML_URL =
  'https://testingcf.jsdelivr.net/gh/cmffomalhaut/wangyou2306@f5e731a/dist-local/simple_card/%E7%95%8C%E9%9D%A2/index.html';

let $iframe: JQuery<HTMLIFrameElement> | null = null;

function openPanel(): void {
  if ($iframe) {
    $iframe.css('display', '');
    return;
  }

  $iframe = $(document.createElement('iframe')) as JQuery<HTMLIFrameElement>;
  $iframe
    .attr('src', UI_HTML_URL)
    .css({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      border: 'none',
      zIndex: '99999',
      background: 'transparent',
    })
    .appendTo('body');

  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== $iframe?.[0]?.contentWindow) return;
    if (e.data?.type === 'panel-close') {
      $iframe?.css('display', 'none');
    }
  });
}

$(() => {
  appendInexistentScriptButtons([{ name: '打开战斗面板', visible: true }]);

  eventOn(getButtonEvent('打开战斗面板'), () => {
    openPanel();
  });
});

$(window).on('pagehide', () => {
  replaceScriptButtons([]);
});
