<template>
  <div ref="reactRoot" class="smash-english-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createRoot } from 'react-dom/client';
import ReactApp from './ReactApp';
import './style.css';
import React from 'react';

const reactRoot = ref<HTMLElement | null>(null);
let root: any = null;

onMounted(() => {
  if (reactRoot.value) {
    root = createRoot(reactRoot.value);
    root.render(React.createElement(ReactApp));
  }
});

onBeforeUnmount(() => {
  if (root) {
    root.unmount();
  }
});
</script>

<style scoped>
.smash-english-container {
  width: 100%;
}
</style>
