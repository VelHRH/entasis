import { defineStore } from "pinia";
import * as auth from "./auth.service";
import type { SessionUser } from "./auth.service";

// Session state as plain data; all Effect stays behind auth.service.
export const useSessionStore = defineStore("session", {
  state: () => ({
    user: null as SessionUser | null,
    // false until the first `me` resolution — the router guard awaits this
    // once so a reload restores the session before any redirect decision.
    resolved: false,
  }),
  actions: {
    async resolve() {
      if (!this.resolved) {
        this.user = await auth.me();
        this.resolved = true;
      }
      return this.user;
    },
    async signUp(email: string, password: string) {
      const result = await auth.signUp(email, password);
      if (result.ok) {
        this.user = result.user;
      }
      return result;
    },
    async login(email: string, password: string) {
      const result = await auth.login(email, password);
      if (result.ok) {
        this.user = result.user;
      }
      return result;
    },
    async logout() {
      await auth.logout();
      this.user = null;
    },
  },
});
