import { createApp } from 'vue';
import { createPinia } from 'pinia';

// 离线拉丁字体（Montserrat）—— 禁止 Google Fonts CDN（G3：100% 离线）
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';

// Paper Design 样式层（顺序不可调整：token → base → texture）
import './styles/tokens.css';
import './styles/base.css';
import './styles/paper-texture.css';

import App from './App.vue';
import { router } from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
