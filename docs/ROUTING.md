# 路由与头部模块导航逻辑

本文档说明本项目的路由组织方式，以及如何在 `layout.vue` 的头部根据不同模块展示不同的导航栏。

## 总览

- 使用单一布局容器：`src/views/layout.vue`。所有业务页面作为它的子路由渲染在 `<RouterView />` 中。
- 模块以固定前缀区分：`/ai/magicImageEdit`、`/ai/library` 等。不同前缀对应不同“模块导航组件”。
- 头部中部区域通过动态组件 `<component :is="..." />` 按当前路由渲染正确的模块导航。

## 相关文件

- `src/router/router.js`：集中定义路由（含模块路由）。
- `src/views/layout.vue`：左侧菜单、头部、主内容；包含“模块导航”的选择逻辑。
- 模块导航组件：
  - `src/components/navbars/NavMagicImageEdit.vue`
  - `src/components/navbars/NavLibrary.vue`

## 路由结构（关键片段）

```js
// src/router/router.js
const routes = [
  {
    path: '/',
    component: LayoutVue,
    redirect: '/ai/library', // 默认进入图片库
    children: [
      // 文章中心
      { path: '/article/category', component: ArticleCategoryVue },
      { path: '/article/manage', component: ArticleManageVue },

      // AI 模块：聊天室
      { path: '/ai/chatRoom', component: UserChatRoomVue },

      // AI 模块：魔法修图
      { path: '/ai/magicImageEdit', component: magicImageEditVue },
      { path: '/ai/magicImageEdit/templates', component: MagicTemplates },
      { path: '/ai/magicImageEdit/history', component: MagicHistory },
      { path: '/ai/magicImageEdit/models', component: MagicModels },

      // AI 模块：图片库
      { path: '/ai/library', component: libraryVue },
      { path: '/ai/library/browse', component: LibraryBrowse },
      { path: '/ai/library/collections', component: LibraryCollections },
      { path: '/ai/library/favorites', component: LibraryFavorites },
    ],
  },
]
```

## 头部模块导航的选择逻辑

`layout.vue` 中根据当前路由前缀选择导航组件并渲染：

```js
// 当前显示的模块导航组件
const currentHeaderNav = computed(() => {
  const path = route.path || ''
  if (path.startsWith('/ai/magicImageEdit')) return NavMagicImageEdit
  if (path.startsWith('/ai/library')) return NavLibrary
  return null // 非模块页不展示模块导航
})
```

模板中居中渲染：

```vue
<div class="header-center">
  <component v-if="currentHeaderNav" :is="currentHeaderNav" />
    <!-- 各导航组件本身是一个横向 el-menu（router 模式） -->
</div>
```

## 左侧菜单的高亮同步

在模块内部切换子页面时，让左侧菜单仍高亮模块入口路径：

```js
const activeMenu = computed(() => {
  const path = route.path || ''
  if (path.startsWith('/ai/magicImageEdit')) return '/ai/magicImageEdit'
  if (path.startsWith('/ai/library')) return '/ai/library'
  return path
})
```

然后传入 `el-menu`：

```vue
<el-menu :default-active="activeMenu" router>
  ...
</el-menu>
```

## 扩展新模块的步骤

1. 创建模块导航组件（示例）并放在 `src/components/navbars/`：
   - `NavXxx.vue`（内部使用 `el-menu` 的 `router` 模式）。
2. 在 `src/router/router.js` 中新增模块入口与子路由，路径前缀保持一致，例如：`/ai/xxx/...`。
3. 在 `src/views/layout.vue`：
   - 导入新导航组件。
   - 在 `currentHeaderNav` 与 `activeMenu` 中各加一个前缀分支。

完成以上三步，即可在该模块下自动展示对应头部导航，并保持侧边高亮一致。

---

维护建议：模块前缀与导航组件 1:1 映射，命名保持统一，后续扩展时只改三处（组件、路由、映射）即可，全局感知点最少。

