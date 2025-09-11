<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const active = computed(() => route.path)
</script>

<template>
  <el-menu mode="horizontal" :default-active="active" router class="module-nav" active-text-color="#409EFF">
    <el-menu-item index="/ai/library">灵感流</el-menu-item>
    <el-menu-item index="/ai/library/browse">浏览</el-menu-item>

    <!-- <el-menu-item index="/ai/library/collections">合集</el-menu-item> -->
    <!-- <el-menu-item index="/ai/library/favorites">收藏</el-menu-item> -->
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
