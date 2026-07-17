<script setup lang="ts">
import { useRouter } from "vue-router";
import { routeNames } from "../../router";
import { useSessionStore } from "../auth/session.store";

const session = useSessionStore();
const router = useRouter();

const logout = async () => {
  await session.logout();
  await router.replace({ name: routeNames.auth });
};
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
    <h1 class="text-2xl font-medium">Entasis</h1>
    <!-- Placeholder home: the Rooms list lands here in a later ticket. -->
    <p class="text-sm text-muted-foreground">Logged in as {{ session.user?.email }}</p>
    <button
      class="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="logout"
    >
      Log out
    </button>
  </main>
</template>
