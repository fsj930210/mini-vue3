import { createApp } from '../../dist/mini-vue.esm-bundler.js';
import App from './App.js';

const rootContainer = document.getElementById('root');
createApp(App).mount(rootContainer);
