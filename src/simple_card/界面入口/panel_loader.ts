// ═══════════════════════════════════════════════════════════════
//  战斗面板入口 —— 独立酒馆助手脚本
//
//  注册按钮"打开战斗面板"，点击后加载 Vue 浮动面板。
//  CDN 部署后，此脚本作为独立入口被角色卡引用。
// ═══════════════════════════════════════════════════════════════

let $container: JQuery<HTMLDivElement> | null = null;

function openPanel(): void {
  if ($container) {
    $container.css('display', '');
    return;
  }

  $container = $(document.createElement('div')) as JQuery<HTMLDivElement>;
  $container.attr('id', 'battle-panel-root').appendTo('body');
  (window as any).mountBattlePanel?.();
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
