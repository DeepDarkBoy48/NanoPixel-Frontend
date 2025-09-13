import { defineStore } from 'pinia'

// 全站主题：light / dark
export default defineStore('theme', {
  state: () => ({
    theme: 'light'
  }),
  actions: {
    init() {
      const saved = localStorage.getItem('app-theme')
      if (saved === 'dark' || saved === 'light') {
        this.theme = saved
      } else {
        // 跟随系统（可自行修改策略）
        this.theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      this.apply(this.theme)
    },
    toggle() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('app-theme', this.theme)
      this.apply(this.theme)
    },
    apply(mode) {
      const root = document.documentElement
      if (mode === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      // 更新浏览器地址栏/系统 UI 的主题色
      const color = mode === 'dark' ? '#0d1117' : '#ffffff'
      const metas = document.querySelectorAll('meta[name="theme-color"]')
      metas.forEach(m => m.setAttribute('content', color))
    }
  },
  persist: true
})
