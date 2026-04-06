import App from './App.vue';

function mountApp() {
  createApp(App).mount('#app');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp, { once: true });
} else {
  mountApp();
}
