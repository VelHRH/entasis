import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useSessionStore } from "@/modules/auth/session.store";
import AuthView from "@/modules/auth/AuthView.vue";
import ChatView from "@/modules/chat/ChatView.vue";
import MyChatsView from "@/modules/chat/MyChatsView.vue";
import RoomsView from "@/modules/rooms/RoomsView.vue";
import RoomView from "@/modules/rooms/RoomView.vue";

export enum RouteName {
  ROOMS = "ROOMS",
  ROOM = "ROOM",
  CHATS = "CHATS",
  CHAT = "CHAT",
  AUTH = "AUTH",
}

const routeConfig: Record<RouteName, RouteRecordRaw & { name: string }> = {
  [RouteName.ROOMS]: { path: "/", name: "rooms", component: RoomsView },
  [RouteName.ROOM]: { path: "/rooms/:roomId", name: "room", component: RoomView, props: true },
  [RouteName.CHATS]: { path: "/chats", name: "chats", component: MyChatsView },
  [RouteName.CHAT]: { path: "/chats/:chatId", name: "chat", component: ChatView, props: true },
  [RouteName.AUTH]: { path: "/auth", name: "auth", component: AuthView, meta: { public: true } },
};

export const routeName = (route: RouteName): string => routeConfig[route].name;

export const router = createRouter({
  history: createWebHistory(),
  routes: [...Object.values(routeConfig), { path: "/:pathMatch(.*)*", redirect: "/" }],
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  const user = await session.resolve();

  if (!to.meta.public && user === null) {
    return { name: routeName(RouteName.AUTH), query: { redirect: to.fullPath } };
  }
  // A logged-in user has no business on the auth screen.
  if (to.name === routeName(RouteName.AUTH) && user !== null) {
    return { name: routeName(RouteName.ROOMS) };
  }
  return true;
});
