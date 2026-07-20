<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { routeNames } from "../../router";
import { useSessionStore } from "../auth/session.store";
import Button from "../../ui/Button.vue";
import { useRoomsStore } from "./rooms.store";

const props = defineProps<{ roomId: string }>();

const session = useSessionStore();
const store = useRoomsStore();

const joining = ref(false);

// The members endpoint returns only the roster, not the room itself; borrow
// the name from the list if the user came through it (unknown on a deep link).
const roomName = computed(
  () => store.rooms.find((room) => room.id === props.roomId)?.name ?? "Room",
);

const load = () => store.loadMembers(props.roomId);

onMounted(() => {
  // On a deep link / refresh the list was never loaded, so the heading has no
  // name to borrow — fetch it in the background to fill it in.
  if (store.rooms.length === 0) store.loadRooms();
  load();
});
// Re-fetch when navigating straight from one room to another (same component).
watch(() => props.roomId, load);

const join = async () => {
  if (joining.value) return;
  joining.value = true;
  const result = await store.joinRoom(props.roomId);
  joining.value = false;
  if (result.ok) await load();
};
</script>

<template>
  <main class="mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
    <RouterLink
      :to="{ name: routeNames.rooms }"
      class="text-sm text-muted-foreground transition hover:text-foreground"
    >
      ← All rooms
    </RouterLink>

    <h1 class="mt-4 truncate text-2xl font-medium">{{ roomName }}</h1>

    <section class="mt-8">
      <p v-if="store.membersLoading" class="text-sm text-muted-foreground">Loading members…</p>

      <p v-else-if="store.membersError" role="alert" class="text-sm text-destructive">
        {{ store.membersError }}
      </p>

      <!-- Non-members never see the roster — just an invitation to join. -->
      <div v-else-if="store.joined === false" class="rounded-lg border border-border bg-card p-6">
        <p class="text-sm text-muted-foreground">You haven't joined this room yet.</p>
        <Button class="mt-4" :disabled="joining" @click="join">
          {{ joining ? "Joining…" : "Join room" }}
        </Button>
      </div>

      <template v-else>
        <h2 class="text-sm font-medium text-muted-foreground">
          Members ({{ store.members.length }})
        </h2>
        <ul class="mt-4 space-y-2">
          <li
            v-for="member in store.members"
            :key="member.id"
            class="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <span class="min-w-0 truncate">{{ member.email }}</span>
            <span
              v-if="member.id === session.user?.id"
              class="shrink-0 text-xs text-muted-foreground"
            >
              you
            </span>
            <!-- The "message" action that opens a 1-on-1 chat arrives in #8. -->
          </li>
        </ul>
      </template>
    </section>
  </main>
</template>
