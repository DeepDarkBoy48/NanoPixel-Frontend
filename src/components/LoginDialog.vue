<script setup>
import { User, Lock } from "@element-plus/icons-vue";
import { ref, watch } from "vue";
import { ElMessage } from 'element-plus'
import { useTokenStore } from "@/store/token";
import { userRegisterService, userLoginService } from "@/api/user";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'login-success'])

const dialogVisible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const tokenStore = useTokenStore();

// 控制注册与登录表单的显示，默认显示登录
const isRegister = ref(false);

// 定义数据模型对象
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
  rePassword: [{ validator: checkRePassword, trigger: "blur" }],
};

// 注册
const register = async () => {
  if (!registerData.value.username || !registerData.value.password || !registerData.value.rePassword) {
    ElMessage.error('请输入完整信息');
    return;
  } else if (registerData.value.password !== registerData.value.rePassword) {
    ElMessage.error('两次输入密码不一致');
    return;
  }
  await userRegisterService(registerData.value);
};

// 登录
const login = async () => {
  if (!registerData.value.username || !registerData.value.password) {
    ElMessage.error('请输入完整信息');
    return;
  }
  let result = await userLoginService(registerData.value);
  tokenStore.setToken(result.data);
  dialogVisible.value = false;
  emit('login-success');
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

// 暴露打开弹窗的方法
const open = () => {
  dialogVisible.value = true
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="dialogVisible" :show-close="true" :close-on-click-modal="true" :close-on-press-escape="true"
    class="login-dialog" width="auto" align-center>
    <div class="login-container">
      <div class="site-info">
        <img src="@/assets/logo.png" alt="Nano Pixel Logo" class="site-logo" />
        <h1 class="site-title">Nano Pixel</h1>
        <p class="site-description">探索纳米像素的无限可能，让创意在这里绽放</p>
      </div>

      <!-- 注册表单 -->
      <el-form ref="form" size="large" autocomplete="off" v-if="isRegister" :model="registerData" :rules="rules">
        <el-form-item prop="username">
          <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input :prefix-icon="Lock" type="password" placeholder="请输入密码" v-model="registerData.password"></el-input>
        </el-form-item>
        <el-form-item prop="rePassword">
          <el-input :prefix-icon="Lock" type="password" placeholder="请输入再次密码"
            v-model="registerData.rePassword"></el-input>
        </el-form-item>
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
              <span class="credential"><span class="credential-label">账号</span><span
                  class="credential-value">徐晨阳2025</span></span>
              <span class="credential-divider">|</span>
              <span class="credential"><span class="credential-label">密码</span><span
                  class="credential-value">123456</span></span>
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
        <el-form-item>
          <el-button class="button" type="primary" auto-insert-space @click="login">登录</el-button>
        </el-form-item>
        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="isRegister = true; clearRegisterData()">
            注册 →
          </el-link>
        </el-form-item>
      </el-form>
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
/* 琥珀色主题变量 - 支持明暗模式 */
.login-container {
  --amber-50: #fffbeb;
  --amber-100: #fef3c7;
  --amber-200: #fde68a;
  --amber-300: #fcd34d;
  --amber-400: #fbbf24;
  --amber-500: #f59e0b;
  --amber-600: #d97706;
  --amber-700: #b45309;
  --amber-800: #92400e;
  --amber-900: #78350f;

  --green-400: #4ade80;
  --green-500: #22c55e;
  --green-600: #16a34a;
  --green-700: #15803d;

  /* 浅色模式（默认） */
  --bg-primary: #ffffff;
  --bg-secondary: #fef7ed;
  --bg-input: #fff7ed;
  --text-primary: #1c1917;
  --text-secondary: #78716c;
  --text-muted: #a8a29e;
  --border-color: #fed7aa;
  --border-focus: #f97316;
  --shadow-color: rgba(249, 115, 22, 0.15);
  --shadow-strong: rgba(249, 115, 22, 0.25);

  width: 420px;
  max-width: 90vw;
  background: var(--bg-primary);
  padding: 40px 36px;
  border-radius: 24px;
  box-shadow:
    0 20px 40px -8px rgba(0, 0, 0, 0.1),
    0 0 0 1px var(--border-color),
    0 0 60px var(--shadow-color);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--amber-400), var(--amber-500), var(--amber-600));
  }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .login-container {
    --bg-primary: #1c1917;
    --bg-secondary: #292524;
    --bg-input: #292524;
    --text-primary: #fafaf9;
    --text-secondary: #a8a29e;
    --text-muted: #78716c;
    --border-color: rgba(251, 191, 36, 0.2);
    --border-focus: #f59e0b;
    --shadow-color: rgba(251, 191, 36, 0.1);
    --shadow-strong: rgba(251, 191, 36, 0.2);

    box-shadow:
      0 20px 40px -8px rgba(0, 0, 0, 0.4),
      0 0 0 1px var(--border-color),
      0 0 60px var(--shadow-color);
  }
}

/* 手动暗色模式切换支持 */
.dark .login-container,
[data-theme="dark"] .login-container {
  --bg-primary: #1c1917;
  --bg-secondary: #292524;
  --bg-input: #292524;
  --text-primary: #fafaf9;
  --text-secondary: #a8a29e;
  --text-muted: #78716c;
  --border-color: rgba(251, 191, 36, 0.2);
  --border-focus: #f59e0b;
  --shadow-color: rgba(251, 191, 36, 0.1);
  --shadow-strong: rgba(251, 191, 36, 0.2);

  box-shadow:
    0 20px 40px -8px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border-color),
    0 0 60px var(--shadow-color);
}

.site-info {
  text-align: center;
  margin-bottom: 32px;
}

.site-logo {
  display: block;
  width: 100px;
  height: auto;
  margin: 0 auto;
  filter: drop-shadow(0 8px 20px var(--shadow-color));
}

.site-title {
  font-size: 2rem;
  color: var(--text-primary);
  margin: 16px 0 8px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.site-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
  letter-spacing: 0.01em;
  max-width: 300px;
  margin: 0 auto;
}

.test-account-tip {
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);
  border: 1px solid rgba(34, 197, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

@media (prefers-color-scheme: dark) {
  .test-account-tip {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
    border-color: rgba(34, 197, 94, 0.25);
  }
}

.dark .test-account-tip,
[data-theme="dark"] .test-account-tip {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
  border-color: rgba(34, 197, 94, 0.25);
}

.tip-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: rgba(34, 197, 94, 0.15);
  border-radius: 16px;
  font-size: 10px;
  font-weight: 600;
  color: var(--green-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
}

@media (prefers-color-scheme: dark) {
  .tip-badge {
    color: var(--green-400);
    background: rgba(34, 197, 94, 0.2);
  }
}

.dark .tip-badge,
[data-theme="dark"] .tip-badge {
  color: var(--green-400);
  background: rgba(34, 197, 94, 0.2);
}

.tip-credentials {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.credential {
  display: flex;
  align-items: center;
  gap: 4px;
}

.credential-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}

.credential-value {
  font-size: 13px;
  color: var(--green-600);
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

@media (prefers-color-scheme: dark) {
  .credential-value {
    color: var(--green-400);
  }
}

.dark .credential-value,
[data-theme="dark"] .credential-value {
  color: var(--green-400);
}

.credential-divider {
  color: var(--text-muted);
  font-weight: 300;
}

.quick-login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--green-500) 0%, var(--green-600) 100%);
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0;
}

.quick-login-btn:hover {
  background: linear-gradient(135deg, var(--green-600) 0%, var(--green-700) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35);
}

:deep(.el-input__wrapper) {
  background: var(--bg-input) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  border: 1px solid var(--border-color) !important;
  padding: 4px 14px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    border-color: var(--amber-400) !important;
  }
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--border-focus) !important;
  box-shadow: 0 0 0 3px var(--shadow-color) !important;
}

:deep(.el-input__inner) {
  color: var(--text-primary) !important;
  font-weight: 500;
  font-size: 14px;

  &::placeholder {
    color: var(--text-muted);
  }
}

:deep(.el-input__prefix-inner) {
  color: var(--amber-500);
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

.button {
  width: 100%;
  background: linear-gradient(135deg, var(--amber-500) 0%, var(--amber-600) 100%);
  border: none;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.05em;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 20px var(--shadow-strong);
  position: relative;
  overflow: hidden;
  color: #fff;

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
    background: linear-gradient(135deg, var(--amber-600) 0%, var(--amber-700) 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 28px var(--shadow-strong);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 6px 16px var(--shadow-color);
  }
}

.flex {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 4px;

  .el-link {
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 13px;
    transition: all 0.25s ease;
    position: relative;
    padding: 8px 14px;
    border-radius: 8px;

    &::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 14px;
      right: 14px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--amber-500), transparent);
      transform: scaleX(0);
      transition: transform 0.25s ease;
    }

    &:hover {
      color: var(--amber-600);
      background: rgba(249, 115, 22, 0.08);

      &::after {
        transform: scaleX(1);
      }
    }
  }
}

@media (prefers-color-scheme: dark) {
  .flex .el-link:hover {
    color: var(--amber-400);
    background: rgba(251, 191, 36, 0.1);
  }
}

.dark .flex .el-link:hover,
[data-theme="dark"] .flex .el-link:hover {
  color: var(--amber-400);
  background: rgba(251, 191, 36, 0.1);
}

@media (max-width: 768px) {
  .login-container {
    width: 94vw;
    padding: 28px 20px;
    border-radius: 20px;
  }

  .site-logo {
    width: 72px;
  }

  .site-title {
    font-size: 1.5rem;
  }

  .site-description {
    font-size: 0.82rem;
    max-width: 240px;
  }

  .test-account-tip {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 14px;
  }

  .tip-info {
    align-items: center;
  }

  .tip-credentials {
    justify-content: center;
  }

  .quick-login-btn {
    width: 100%;
    padding: 10px 14px;
  }

  .site-info {
    margin-bottom: 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .button {
    height: 44px;
    font-size: 14px;
    border-radius: 10px;
  }
}
</style>

<style lang="scss">
/* 全局样式覆盖 el-dialog */
.login-dialog {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 24px !important;
  overflow: visible !important;

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0 !important;
    background: transparent !important;
  }
}

/* 弹窗遮罩层优化 */
.el-overlay {
  backdrop-filter: blur(4px);
}
</style>
