//导入request请求工具
import request from "@/utils/request";

/**
 * 1. 首先,函数接收一个registerData参数,这是包含用户注册信息的对象
 * 3. URLSearchParams把数据转换成 application/x-www-form-urlencoded 格式
 * 4. 最后我们把数据发送到服务器的注册接口
 */
export const userRegisterService = (registerData) => {
  const params = new URLSearchParams();
  for (let key in registerData) {
    params.append(key, registerData[key]);
  }
  return request.post("/user/register", params);
};


// 这是用户登录的函数
export const userLoginService = (loginData) => {
  const params = new URLSearchParams();
  for (let key in loginData) {
    params.append(key, loginData[key]);
  }
  return request.post("/user/login", params);
};
