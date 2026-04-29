import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './global.css';

(window as any).mountBattlePanel = function() {
  const container = document.getElementById('battle-panel-root') ?? document.body;
  createApp(App).use(createPinia()).mount(container);
};
