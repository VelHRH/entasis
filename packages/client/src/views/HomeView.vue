<script setup lang="ts">
import { useRouter } from "vue-router";
import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();

const logout = async () => {
  await session.logout();
  await router.replace({ name: "auth" });
};
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
    <h1 class="text-2xl font-bold text-gray-900">Entasis</h1>
    <!-- Placeholder home: the Rooms list lands here in a later ticket. -->
    <p class="text-gray-600">Logged in as {{ session.user?.email }}</p>
    <button
      class="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700"
      @click="logout"
    >
      Log out
    </button>
  </main>
</template>
