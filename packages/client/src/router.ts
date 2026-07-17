import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "./modules/auth/session.store";
import AuthView from "./modules/auth/AuthView.vue";
import HomeView from "./modules/home/HomeView.vue";

// Route names are part of each module's public surface (ADR-0002): navigate
// with these constants, never with string literals.
export const routeNames = {
  home: "home",
  auth: "auth",
} as const;

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: routeNames.home, component: HomeView },
    { path: "/auth", name: routeNames.auth, component: AuthView, meta: { public: true } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  const user = await session.resolve();

  if (!to.meta.public && user === null) {
    return { name: routeNames.auth, query: { redirect: to.fullPath } };
  }
  // A logged-in user has no business on the auth screen.
  if (to.name === routeNames.auth && user !== null) {
    return { name: routeNames.home };
  }
  return true;
});
