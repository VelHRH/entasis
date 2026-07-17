<script setup lang="ts">
import { useRouter } from "vue-router";
import { routeNames } from "../../router";
import { useSessionStore } from "../auth/session.store";
import Button from "../../ui/Button.vue";

const session = useSessionStore();
const router = useRouter();

const logout = async () => {
  await session.logout();
  await router.replace({ name: routeNames.auth });
};
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
    <h1 class="text-2xl font-medium">Entasis</h1>
    <!-- Placeholder home: the Rooms list lands here in a later ticket. -->
    <p class="text-muted-foreground">Logged in as {{ session.user?.email }}</p>
    <Button variant="secondary" @click="logout">Log out</Button>
  </main>
</template>
