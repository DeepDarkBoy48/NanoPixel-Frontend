//定制请求的实例

//导入axios  npm install axios
import axios from "axios";
//定义一个变量,记录公共的前缀  ,  baseURL
const baseURL = "/api";
const instance = axios.create({ baseURL });
import { ElMessage } from "element-plus";

//导入token状态
import { useTokenStore } from "@/store/token.js";
//导入登录弹窗状态
import { useLoginDialogStore } from "@/store/loginDialog.js";
//添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    //在发送请求之前做什么
    const tokenStore = useTokenStore();
    console.log("pinia中的token", tokenStore.token);
    //如果token中有值，在携带
    if (tokenStore.token) {
      config.headers.Authorization = tokenStore.token;
    }
    return config;
  },
  (err) => {
    //如果请求错误做什么
    return Promise.reject(err);
  }
);

//添加响应拦截器
//axios通过参数的位置来决定，第一个参数是成功的回调，第二个参数是失败的回调
//添加响应拦截器
instance.interceptors.response.use(
  (result) => {
    // Special handling for FastAPI endpoints which return raw JSON
    // Check baseURL override or url pattern
    if (result.config.url && (result.config.url.startsWith('/fastapi') || result.config.url.includes('/fastapi'))) {
      return result.data;
    }

    //如果业务状态码为0，代表本次操作成功
    if (result.data.code == 0) {
      ElMessage.success(result.data.message || "操作成功");
      // const data = result.data.data;
      // const allData = result.data;
      // console.log(data);
      // console.log(allData);
      return result.data;
    }

    //代码走到这里，代表业务状态码不是0，本次操作失败
    ElMessage.error(result.data.message || "操作失败");
    return Promise.reject(result.data); //异步的状态转化成失败的状态
  },
  (err) => {
    //如果响应状态码是401，代表token失效
    if (err.response && err.response.status === 401) {
      ElMessage.error("登录状态已过期，请重新登录");
      const tokenStore = useTokenStore();
      tokenStore.removeToken();
      // 弹出登录框而非跳转登录页
      const loginDialogStore = useLoginDialogStore();
      loginDialogStore.show();
    } else {
      ElMessage.error("服务异常");
    }
    return Promise.reject(err); //异步的状态转化成失败的状态
  }
);
export default instance;
