<script setup lang="ts">
import { onMounted } from "vue";
import { routeNames } from "../../router";
import { useChatStore } from "./chat.store";

const store = useChatStore();

onMounted(() => store.loadMyChats());
</script>

<template>
  <main class="mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
    <header>
      <RouterLink
        :to="{ name: routeNames.rooms }"
        class="text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← Rooms
      </RouterLink>
      <h1 class="mt-4 text-2xl font-medium">Your chats</h1>
      <p class="mt-1 text-sm text-muted-foreground">Return to a conversation.</p>
    </header>

    <section class="mt-8">
      <p v-if="store.myChatsLoading" class="text-sm text-muted-foreground">Loading chats…</p>

      <p v-else-if="store.myChatsError" role="alert" class="text-sm text-destructive">
        {{ store.myChatsError }}
      </p>

      <p v-else-if="store.myChats.length === 0" class="text-sm text-muted-foreground">
        No chats yet. Open one from a room member.
      </p>

      <ul v-else class="space-y-3">
        <li v-for="chat in store.myChats" :key="chat.id">
          <RouterLink
            :to="{ name: routeNames.chat, params: { chatId: chat.id } }"
            class="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:bg-accent"
          >
            <span class="min-w-0 truncate font-medium">{{ chat.partnerEmail }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </main>
</template>
