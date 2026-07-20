<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { routeNames } from "../../router";
import { useSessionStore } from "../auth/session.store";
import Button from "../../ui/Button.vue";
import Input from "../../ui/Input.vue";
import { useRoomsStore } from "./rooms.store";

const session = useSessionStore();
const store = useRoomsStore();
const router = useRouter();

const newRoomName = ref("");
const creating = ref(false);
const createError = ref<string | null>(null);
const joiningId = ref<string | null>(null);

onMounted(() => store.loadRooms());

const open = (roomId: string) => router.push({ name: routeNames.room, params: { roomId } });

const join = async (roomId: string) => {
  if (joiningId.value) return;
  joiningId.value = roomId;
  const result = await store.joinRoom(roomId);
  joiningId.value = null;
  // Landing inside the room right after joining is the point of joining.
  if (result.ok) open(roomId);
};

const create = async () => {
  const name = newRoomName.value.trim();
  if (!name || creating.value) return;
  creating.value = true;
  createError.value = null;
  const result = await store.createRoom(name);
  creating.value = false;
  if (result.ok) {
    newRoomName.value = "";
  } else {
    createError.value = result.message;
  }
};

const logout = async () => {
  await session.logout();
  await router.replace({ name: routeNames.auth });
};
</script>

<template>
  <main class="mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
    <header class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-medium">Rooms</h1>
        <p class="mt-1 text-sm text-muted-foreground">Pick where to spend the night.</p>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <RouterLink
          :to="{ name: routeNames.chats }"
          class="text-sm text-muted-foreground transition hover:text-foreground"
        >
          My chats
        </RouterLink>
        <Button variant="secondary" @click="logout">Log out</Button>
      </div>
    </header>

    <!-- Dev-only stopgap: creating rooms becomes admin-only once roles land. -->
    <form
      class="mt-8 flex flex-col gap-3 rounded-lg border border-dashed border-border bg-card p-4 sm:flex-row sm:items-end"
      @submit.prevent="create"
    >
      <div class="flex-1">
        <Input v-model="newRoomName" label="New room (dev only)" required />
      </div>
      <Button type="submit" :disabled="creating || !newRoomName.trim()">Create</Button>
    </form>
    <p v-if="createError" role="alert" class="mt-2 text-sm text-destructive">{{ createError }}</p>

    <section class="mt-10">
      <p v-if="store.roomsLoading" class="text-sm text-muted-foreground">Loading rooms…</p>

      <p v-else-if="store.roomsError" role="alert" class="text-sm text-destructive">
        {{ store.roomsError }}
      </p>

      <p v-else-if="store.rooms.length === 0" class="text-sm text-muted-foreground">
        No rooms yet. Create the first one above.
      </p>

      <ul v-else class="space-y-3">
        <li
          v-for="room in store.rooms"
          :key="room.id"
          class="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <span class="min-w-0 flex-1 truncate font-medium">{{ room.name }}</span>
          <div class="flex shrink-0 gap-2">
            <Button variant="secondary" @click="open(room.id)">Open</Button>
            <Button :disabled="joiningId === room.id" @click="join(room.id)">
              {{ joiningId === room.id ? "Joining…" : "Join" }}
            </Button>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>
