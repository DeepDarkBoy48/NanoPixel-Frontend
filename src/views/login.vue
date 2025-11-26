<script setup>
import './login_sticker.css';
import { User, Lock, MagicStick } from "@element-plus/icons-vue";
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

// 一键登录测试账号
const oneClickLogin = async () => {
  registerData.value.username = '徐晨阳2025';
  registerData.value.password = '123456';
  await login();
}

// 清空注册数据
const clearRegisterData = () => {
  registerData.value.username = "";
  registerData.value.password = "";
  registerData.value.rePassword = "";
}

const goBlog = () => {
  router.push({ path: '/blog' })
}

const goSmashEnglish = () => {
  router.push({ path: '/smashEnglish' })
}
</script>

<template>
  <div class="login-page">
    <div class="background-animation"></div>
    <!-- 光晕装饰 -->
    <div class="glow-orb glow-1"></div>
    <div class="glow-orb glow-2"></div>
    <div class="glow-orb glow-3"></div>
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
            <div class="test-account-tip">
              <div class="tip-info">
                <span class="tip-badge">测试账号</span>
                <div class="tip-credentials">
                  <span class="credential"><span class="credential-label">账号</span><span class="credential-value">徐晨阳2025</span></span>
                  <span class="credential-divider">|</span>
                  <span class="credential"><span class="credential-label">密码</span><span class="credential-value">123456</span></span>
                </div>
              </div>
              <el-button class="quick-login-btn" size="large" @click="oneClickLogin">一键登录</el-button>
            </div>
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
            <!-- Smash English Sticker -->
            <div class="smash-english-sticker" @click="goSmashEnglish">
              <div class="sticker-content">
                <el-icon class="sticker-icon"><MagicStick /></el-icon>
                <span>Smash English</span>
              </div>
              <div class="sticker-shine"></div>
            </div>
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
  background: linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 25%, #2d1b4e 50%, #1e3a5f 75%, #0c0c1e 100%);
  background-size: 400% 400%;
  animation: gradientBG 20s ease infinite;
  z-index: 0;
}

.background-animation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 0, 128, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(0, 150, 255, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

// 光晕装饰球
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;
  animation: pulse-glow 8s ease-in-out infinite;
}

.glow-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.glow-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, transparent 70%);
  bottom: -50px;
  right: -50px;
  animation-delay: -3s;
}

.glow-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -5s;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.9;
  }
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
  width: 480px;
  background: linear-gradient(
    145deg,
    rgba(30, 30, 60, 0.85) 0%,
    rgba(20, 20, 50, 0.9) 50%,
    rgba(40, 20, 60, 0.85) 100%
  );
  padding: 48px 40px;
  border-radius: 28px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 100px rgba(147, 51, 234, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: card-appear 0.8s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  &:hover {
    box-shadow: 
      0 35px 60px -15px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 0 120px rgba(147, 51, 234, 0.25);
    border-color: rgba(255, 255, 255, 0.12);
  }
}

@keyframes card-appear {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.site-info {
  text-align: center;
  margin-bottom: 36px;
}

.site-logo {
  display: block;
  width: 160px;
  height: auto;
  margin: 0 auto;
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 10px 30px rgba(147, 51, 234, 0.3));
  transition: all 0.3s ease;

  &:hover {
    filter: drop-shadow(0 15px 40px rgba(147, 51, 234, 0.5));
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-8px) rotate(1deg);
  }
  75% {
    transform: translateY(-4px) rotate(-1deg);
  }
}

.site-title {
  font-size: 2.8rem;
  color: #fff;
  margin: 16px 0 8px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  animation: title-glow 3s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(196, 181, 253, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(196, 181, 253, 0.5));
  }
}

.site-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.6;
  letter-spacing: 0.02em;
  max-width: 320px;
  margin: 0 auto;
}

.test-account-tip {
  margin-bottom: 20px;
  padding: 16px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.06) 100%);
  border: 1px solid rgba(34, 197, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.tip-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
}

.tip-credentials {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.credential {
  display: flex;
  align-items: center;
  gap: 6px;
}

.credential-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.credential-value {
  font-size: 14px;
  color: #4ade80;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

.credential-divider {
  color: rgba(255, 255, 255, 0.2);
  font-weight: 300;
}

.quick-login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
  border: none;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0;
}

.quick-login-btn:hover {
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.4);
}

/* 移除旧箭头与动效，整体更紧凑 */

.form-title {
  color: #fff;
  text-align: center;
  width: 100%;
  margin-bottom: 1rem;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.35) !important;
  border-radius: 14px !important;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 1px 0 rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 4px 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    background: rgba(0, 0, 0, 0.4) !important;
    border-color: rgba(147, 51, 234, 0.4) !important;
  }
}

:deep(.el-input__wrapper.is-focus) {
  background: rgba(0, 0, 0, 0.45) !important;
  border-color: rgba(147, 51, 234, 0.7) !important;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 0 4px rgba(147, 51, 234, 0.15),
    0 0 20px rgba(147, 51, 234, 0.2) !important;
}

:deep(.el-input__inner) {
  color: #fff !important;
  font-weight: 500;
  font-size: 15px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

:deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-form-item) {
  margin-bottom: 18px;
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
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%);
  border: none;
  height: 52px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 10px 25px rgba(139, 92, 246, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #c026d3 100%);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 
      0 15px 35px rgba(139, 92, 246, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(1);
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
  }
}

.flex {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 8px;

  .el-link {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    position: relative;
    padding: 8px 16px;
    border-radius: 8px;

    &::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.6), transparent);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    &:hover {
      color: #c4b5fd;
      background: rgba(147, 51, 234, 0.1);

      &::after {
        transform: scaleX(1);
      }
    }
  }
}

@media (max-width: 768px) {
  .glow-orb {
    display: none;
  }

  .login-container {
    width: 94%;
    padding: 28px 20px;
    border-radius: 24px;
    margin: 16px;
  }

  .site-logo {
    width: 100px;
    margin-bottom: 8px;
  }

  .site-title {
    font-size: 1.8rem;
    margin: 8px 0 6px;
  }

  .site-description {
    font-size: 0.85rem;
    margin-bottom: 8px;
    max-width: 260px;
  }

  .test-account-tip {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .tip-info {
    align-items: center;
  }

  .tip-credentials {
    justify-content: center;
  }

  .quick-login-btn {
    width: 100%;
    padding: 12px 16px;
  }

  .site-info {
    margin-bottom: 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px !important;
    padding: 2px 14px !important;
  }

  .button {
    height: 48px;
    font-size: 15px;
    border-radius: 12px;
  }

  .blog-button-container {
    margin-top: 6px;
  }

  .flex {
    margin-top: 4px;
  }
}
</style>
