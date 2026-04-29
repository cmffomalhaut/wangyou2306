import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../界面/App.vue';

const IFRAME_SRCDOC = `<!DOCTYPE html><html><head><style>*,*::before,*::after{box-sizing:border-box;}html,body{margin:0!important;padding:0;overflow:hidden!important;max-width:100%!important;}</style></head><body></body></html>`;

let $iframe: JQuery<HTMLIFrameElement> | null = null;
let vueApp: ReturnType<typeof createApp> | null = null;
let $teleportedStyle: JQuery | null = null;

function openPanel(): void {
  if ($iframe) {
    $iframe.css('display', '');
    return;
  }

  $iframe = ($('<iframe>').attr({ frameborder: 0, srcdoc: IFRAME_SRCDOC }) as JQuery<HTMLIFrameElement>)
    .css({ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', border: 'none', zIndex: 99999 })
    .appendTo('body')
    .on('load', () => {
      const doc = $iframe![0].contentDocument!;
      $teleportedStyle = $('<div>').append($('head > style', document).clone()).appendTo(doc.head);
      vueApp = createApp(App).use(createPinia());
      vueApp.mount(doc.body);
    });
}

function closePanel(): void {
  if ($iframe) $iframe.css('display', 'none');
}

$(() => {
  appendInexistentScriptButtons([{ name: '打开战斗面板', visible: true }]);
  eventOn(getButtonEvent('打开战斗面板'), () => openPanel());

  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== $iframe?.[0]?.contentWindow) return;
    if (e.data?.type === 'battle-close') closePanel();
  });
});

$(window).on('pagehide', () => {
  vueApp?.unmount();
  $teleportedStyle?.remove();
  $iframe?.remove();
  $iframe = null;
  vueApp = null;
  $teleportedStyle = null;
});
