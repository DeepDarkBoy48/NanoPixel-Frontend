//定制请求的实例

//导入axios  npm install axios
import axios from "axios";
//定义一个变量,记录公共的前缀  ,  baseURL
const baseURL = "/api";
const instance = axios.create({ baseURL });

//添加响应拦截器
//axios通过参数的位置来决定，第一个参数是成功的回调，第二个参数是失败的回调
instance.interceptors.response.use(
  (result) => {
    return result.data;
  },
  (err) => {
    alert("服务异常");
    return Promise.reject(err); //异步的状态转化成失败的状态
  }
);
export default instance;

