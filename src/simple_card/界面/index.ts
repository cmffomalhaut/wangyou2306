import App from './App.vue';
import './global.css';

const container = document.getElementById('battle-panel-root') ?? document.body;
createApp(App).use(createPinia()).mount(container);
