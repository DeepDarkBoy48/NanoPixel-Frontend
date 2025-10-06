<script setup>
import { User, Lock } from "@element-plus/icons-vue";
import { ref } from "vue";
//引入element-plus的消息提示组件
import { ElMessage } from 'element-plus'
//控制注册与登录表单的显示， 默认显示注册
const isRegister = ref(false);

//定义数据模型对象
const registerData = ref({
  username: "",
  password: "",
  rePassword: "",
});

// 自定义校验规则
const checkRePassword = (rule, value, callback) => {
  if (value === "") {
    callback(new Error("请再次确认密码"));
  } else if (value !== registerData.value.password) {
    callback(new Error("请确保两次输入的密码一样"));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 5, max: 16, message: "长度为5~16位非空字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 5, max: 16, message: "长度为5~16位非空字符", trigger: "blur" },
  ],
  //自定义规则
  rePassword: [{ validator: checkRePassword, trigger: "blur" }],
};

//调用后台接口，完成注册
import { userRegisterService } from "@/api/user";
const register = async () => {
  //校验表单数据
  if (!registerData.value.username || !registerData.value.password || !registerData.value.rePassword) {
    ElMessage.error('请输入完整信息');
    return;
  } else if (registerData.value.password !== registerData.value.rePassword) {
    ElMessage.error('两次输入密码不一致');
    return;
  }
  let result = await userRegisterService(registerData.value);
  // if (result.code === "0") {
  //   alert("注册成功");
  // } else {
  //   alert(result.message);
  // }
};

import { useTokenStore } from "@/store/token";
const tokenStore = useTokenStore();
//调用后台接口，完成登录
import { userLoginService } from "@/api/user";
//引入路由模块
import { useRouter } from 'vue-router'
const router = useRouter();
const login = async () => {
  //校验表单数据
  if (!registerData.value.username || !registerData.value.password) {
    ElMessage.error('请输入完整信息');
    return;
  }
  let result = await userLoginService(registerData.value);
  tokenStore.setToken(result.data);
  // if (result.code === "0") {
  //   alert("登录成功");
  //登录成功，跳转到首页
  router.push({ path: '/' });
  // } else {
  //   alert(result.message);
  // }
};

// 清空注册数据
const clearRegisterData = () => {
  registerData.value.username = "";
  registerData.value.password = "";
  registerData.value.rePassword = "";
}

const goBlog = () => {
  router.push({ path: '/blog' })
}
</script>

<template>
  <div class="login-page">
    <div class="background-animation"></div>
    <el-row>
      <el-col :span="24">
        <div class="login-container">
          <div class="site-info">
            <img src="@/assets/logo.png" alt="Nano Pixel Logo" class="site-logo" />
            <h1 class="site-title">Nano Pixel</h1>
            <p class="site-description">探索纳米像素的无限可能，让创意在这里绽放</p>
          </div>
          <el-form ref="form" size="large" autocomplete="off" v-if="isRegister" :model="registerData" :rules="rules">
            <!-- prop="username"加入规则字段标签 -->
            <el-form-item prop="username">
              <!-- v-model="registerData.username" 绑定数据模型 -->
              <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input :prefix-icon="Lock" type="password" placeholder="请输入密码"
                v-model="registerData.password"></el-input>
            </el-form-item>
            <el-form-item prop="rePassword">
              <el-input :prefix-icon="Lock" type="password" placeholder="请输入再次密码"
                v-model="registerData.rePassword"></el-input>
            </el-form-item>
            <!-- 注册按钮 -->
            <el-form-item>
              <el-button class="button" type="primary" auto-insert-space @click="register">
                注册
              </el-button>
            </el-form-item>
            <el-form-item class="flex">
              <el-link type="info" :underline="false" @click="isRegister = false; clearRegisterData()">
                ← 返回
              </el-link>
            </el-form-item>
          </el-form>
          <!-- 登录表单 -->
          <el-form ref="form" size="large" autocomplete="off" v-else :model="registerData" :rules="rules">
            <div class="test-account-tip">测试账号：徐晨阳 密码：123456</div>
            <el-form-item prop="username">
              <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input name="password" :prefix-icon="Lock" type="password" placeholder="请输入密码"
                v-model="registerData.password"></el-input>
            </el-form-item>
            <!-- 登录按钮 -->
            <el-form-item>
              <el-button class="button" type="primary" auto-insert-space @click="login">登录</el-button>
            </el-form-item>
            <!-- <el-form-item class="blog-button-container">
              <el-button class="blog-button" text @click="goBlog">前往博客</el-button>
            </el-form-item> -->
            <el-form-item class="flex">
              <el-link type="info" :underline="false" @click="isRegister = true; clearRegisterData()">
                注册 →
              </el-link>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  z-index: 0;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 420px;
  background: rgba(0, 0, 0, 0.3);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 15px 35px 0 rgba(0, 0, 0, 0.4),
    0 0 60px 0 rgba(233, 69, 96, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px 0 rgba(0, 0, 0, 0.5),
      0 0 80px 0 rgba(233, 69, 96, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.site-info {
  text-align: center;
  margin-bottom: 30px;
}

.site-logo {
  width: 200px;
  height: auto;
  margin-bottom: 30px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.site-title {
  font-size: 2.5rem;
  color: #fff;
  margin: 10px 0;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}

.site-description {
  color: #e0e0e0;
  font-size: 1rem;
  line-height: 1.5;
}

.test-account-tip {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 152, 0, 0.16);
  border: 1px solid rgba(255, 152, 0, 0.45);
  color: #ffa726;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.02em;
}

.form-title {
  color: #fff;
  text-align: center;
  width: 100%;
  margin-bottom: 1rem;
  font-weight: 500;
}

:deep(.el-input__inner) {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 500;
  backdrop-filter: blur(5px);

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(233, 69, 96, 0.8);
    box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.3);
    color: #fff;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
  }
}

:deep(.el-input__prefix-inner) {
  color: #fff;
}

.button-group {
  .el-button {
    width: 100%;

    &:first-child {
      margin-bottom: 10px;
    }
  }
}

.blog-button-container {
  text-align: center;
  margin-top: -10px;
}

.blog-button {
  color: #eee;

  &:hover {
    color: #fff;
  }
}

.button {
  width: 100%;
  background: linear-gradient(135deg, #e94560, #533483);
  border: none;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(233, 69, 96, 0.3);

  &:hover {
    background: linear-gradient(135deg, #533483, #e94560);
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(233, 69, 96, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
  }
}

.flex {
  width: 100%;
  display: flex;
  justify-content: center;

  .el-link {
    color: #eee;

    &:hover {
      color: #fff;
    }
  }
}

@media (max-width: 768px) {
  .login-container {
    width: 92%;
    padding: 16px;
  }

  .site-logo {
    width: 120px;
    margin-bottom: 12px;
  }

  .site-title {
    font-size: 1.6rem;
    margin: 6px 0 8px;
  }

  .site-description {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }

  .test-account-tip {
    font-size: 0.9rem;
    margin-bottom: 12px;
  }

  .site-info {
    margin-bottom: 16px;
  }

  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  .blog-button-container {
    margin-top: 6px;
  }

  .flex {
    margin-top: 0;
  }
}
</style>
