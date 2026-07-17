import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "./modules/auth/session.store";
import AuthView from "./modules/auth/AuthView.vue";
import HomeView from "./modules/home/HomeView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/auth", name: "auth", component: AuthView, meta: { public: true } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  const user = await session.resolve();

  if (!to.meta.public && user === null) {
    return { name: "auth", query: { redirect: to.fullPath } };
  }
  // A logged-in user has no business on the auth screen.
  if (to.name === "auth" && user !== null) {
    return { name: "home" };
  }
  return true;
});
