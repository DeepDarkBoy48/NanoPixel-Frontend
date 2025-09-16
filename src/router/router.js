//导入vue-router
import { createRouter, createWebHistory } from "vue-router"; //导入组件
import LoginVue from "@/views/login.vue";
import LayoutVue from "@/views/layout.vue"; //定义路由关系
import ArticleCategoryVue from "@/views/article/ArticleCategory.vue";
import ArticleManageVue from "@/views/article/ArticleManage.vue";
import UserInfoVue from "@/views/user/UserInfo.vue";
import UserAvatarVUe from "@/views/user/UserAvatar.vue";
import UserResetPasswordVue from "@/views/user/UserResetPassword.vue";
import UserChatRoomVue from "@/views/ai/UserChatRoom.vue";
import BlogVue from "@/views/blog/blog.vue";
import magicImageEditVue from "@/views/ai/magicImageEdit.vue";
import libraryVue from "@/views/ai/library.vue";
import MagicTemplates from "@/views/ai/magicedit/MagicTemplates.vue";
import MagicHistory from "@/views/ai/magicedit/MagicHistory.vue";
import MagicModels from "@/views/ai/magicedit/MagicModels.vue";
import LibraryBrowse from "@/views/ai/librarypages/LibraryBrowse.vue";
import LibraryCollections from "@/views/ai/librarypages/LibraryCollections.vue";
import LibraryFavorites from "@/views/ai/librarypages/LibraryFavorites.vue";
import canvasVue from "@/views/ai/canvas.vue";
import LibraryDetail from "@/views/ai/libraryDetail.vue";

// 路由配置说明：
// - 根路径使用 Layout 作为统一布局容器，所有业务页面作为其子路由渲染在 <router-view/>
// - AI 模块使用固定前缀 /ai/，根据不同子前缀（magicImageEdit、library）在头部展示不同模块导航（见 layout.vue）
// - 如需新增模块，请添加路由并在 layout.vue 中注册对应的模块导航组件
const routes = [
  { path: "/login", component: LoginVue },
  {
    path: "/",
    component: LayoutVue,
    // 重定向：进入根路径时默认打开图片库
    redirect: "/ai/library",
    // 子路由：在 Layout 内切换主体内容
    children: [
      // 文章中心
      { path: "/article/category", component: ArticleCategoryVue },
      { path: "/article/manage", component: ArticleManageVue },
      { path: "/user/info", component: UserInfoVue },
      { path: "/user/avatar", component: UserAvatarVUe },
      { path: "/user/resetPassword", component: UserResetPasswordVue },
      // AI 模块：聊天室
      { path: "/ai/chatRoom", component: UserChatRoomVue },

      // AI 模块：魔法修图（入口 + 子页面）
      { path: "/ai/magicImageEdit", component: magicImageEditVue },
      { path: "/ai/magicImageEdit/templates", component: MagicTemplates },
      { path: "/ai/magicImageEdit/history", component: MagicHistory },
      { path: "/ai/magicImageEdit/models", component: MagicModels },

      // AI 模块：图片库（入口 + 子页面）
      { path: "/ai/library", component: libraryVue },
      { path: "/ai/library/browse", component: LibraryBrowse },
      { path: "/ai/library/collections", component: LibraryCollections },
      { path: "/ai/library/favorites", component: LibraryFavorites },
      { path: "/ai/library/:mediaId", component: LibraryDetail },

      // AI 模块：Canvas
      { path: "/ai/canvas", component: canvasVue },
    ],
  },
  { path: "/blog", component: BlogVue },
];

//创建路由器
const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

export default router;
