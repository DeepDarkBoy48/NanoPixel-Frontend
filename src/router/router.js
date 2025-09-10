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

//定义路由关系
const routes = [
  { path: "/login", component: LoginVue },
  {
    path: "/",
    component: LayoutVue,
    //重定向
    redirect: "/article/manage",
    //子路由
    children: [
      { path: "/article/category", component: ArticleCategoryVue },
      { path: "/article/manage", component: ArticleManageVue },
      { path: "/user/info", component: UserInfoVue },
      { path: "/user/avatar", component: UserAvatarVUe },
      { path: "/user/resetPassword", component: UserResetPasswordVue },
      { path: "/ai/chatRoom", component: UserChatRoomVue },
      { path: "/ai/magicImageEdit", component: magicImageEditVue },
      { path: "/ai/library", component: libraryVue },
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
