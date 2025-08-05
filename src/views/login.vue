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


</script>

<template>
  <el-row class="login-page">
    <el-col :span="12" class="bg"></el-col>
    <el-col :span="6" :offset="3" class="form">
      <!-- 注册表单 -->
      <!-- v-if:是否显示注册或者登陆 -->
      <!-- :rules="rules" 加入规则校验 -->
      <!-- :model="registerData" 绑定数据模型 -->
      <el-form ref="form" size="large" autocomplete="off" v-if="isRegister" :model="registerData" :rules="rules">
        <el-form-item>
          <h1>注册</h1>
        </el-form-item>
        <!-- prop="username"加入规则字段标签 -->
        <el-form-item prop="username">

          <!-- v-model="registerData.username" 绑定数据模型 -->
          <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input :prefix-icon="Lock" type="password" placeholder="请输入密码" v-model="registerData.password"></el-input>
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
        <el-form-item>
          <h1>登录</h1>
        </el-form-item>
        <el-form-item prop="username">
          <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input name="password" :prefix-icon="Lock" type="password" placeholder="请输入密码"
            v-model="registerData.password"></el-input>
        </el-form-item>
        <el-form-item class="flex">
          <div class="flex">
            <el-checkbox>记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
        </el-form-item>
        <!-- 登录按钮 -->
        <el-form-item>
          <el-button class="button" type="primary" auto-insert-space @click="login">登录</el-button>
        </el-form-item>
        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="isRegister = true; clearRegisterData()">
            注册 →
          </el-link>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
</template>

<style lang="scss" scoped>
/* 样式 */
.login-page {
  height: 100vh;
  background-color: #fff;

  .bg {
    background: url("@/assets/logo.png") no-repeat 60% center / 240px auto,
      url("@/assets/login_bg.jpg") no-repeat center / cover;
    border-radius: 0 20px 20px 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    user-select: none;

    .title {
      margin: 0 auto;
    }

    .button {
      width: 100%;
    }

    .flex {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>
