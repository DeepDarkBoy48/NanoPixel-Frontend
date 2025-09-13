<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const active = computed(() => route.path)
</script>

<template>
  <el-menu mode="horizontal" :default-active="active" router class="module-nav" :active-text-color="'var(--app-primary)'">
    <el-menu-item index="/ai/magicImageEdit">工作台</el-menu-item>
    <!-- <el-menu-item index="/ai/magicImageEdit/templates">模版</el-menu-item> -->
    <el-menu-item index="/ai/magicImageEdit/history">历史</el-menu-item>
    <el-menu-item index="/ai/magicImageEdit/models">模型</el-menu-item>
  </el-menu>

</template>

<style scoped>
.module-nav {
  border-bottom: none;
  background: transparent;
  max-width: 100%;
  overflow-x: auto;
}
</style>
