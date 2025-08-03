import "./assets/main.scss";

import { createPinia } from "pinia";

import { createApp } from "vue"; //导入vue
import ElementPlus from "element-plus"; //导入element-plus
import "element-plus/dist/index.css"; //导入element-plus的样式
import App from "./App.vue"; //导入app.vue
import router from "@/router/router"; //导入路由
import { createPersistedState } from "pinia-persistedstate-plugin";
const app = createApp(App); //创建应用实例
const pinia = createPinia(); //创建pinia实例
const persist = createPersistedState();
pinia.use(persist);
app.use(pinia); //使用pinia
app.use(router); //使用路由
app.use(ElementPlus); //使用element-plus

//必须在mount前使用路由
app.mount("#app"); //控制html元素
