import "./assets/main.scss";

import { createApp } from "vue"; //导入vue
import ElementPlus from "element-plus"; //导入element-plus
import "element-plus/dist/index.css"; //导入element-plus的样式
import App from "./App.vue"; //导入app.vue
import router from "@/router/router"; //导入路由

const app = createApp(App); //创建应用实例

app.use(router); //使用路由
app.use(ElementPlus); //使用element-plus

//必须在mount前使用路由
app.mount("#app"); //控制html元素
