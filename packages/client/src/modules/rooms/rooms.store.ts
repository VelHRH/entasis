import { defineStore } from "pinia";
import * as rooms from "./rooms.service";
import type { RoomMember, RoomView } from "./rooms.service";

// Rooms state as plain data; all Effect stays behind the module's service.
export const useRoomsStore = defineStore("rooms", {
  state: () => ({
    rooms: [] as ReadonlyArray<RoomView>,
    roomsLoading: false,
    roomsError: null as string | null,

    // Room detail: members of the room currently being viewed. `joined` is
    // null until the first load resolves — the detail screen shows a spinner
    // until then, then either the roster or a "join first" prompt.
    members: [] as ReadonlyArray<RoomMember>,
    membersLoading: false,
    membersError: null as string | null,
    joined: null as boolean | null,
  }),
  actions: {
    async loadRooms() {
      this.roomsLoading = true;
      this.roomsError = null;
      const result = await rooms.listRooms();
      if (result.ok) {
        this.rooms = result.data;
      } else {
        this.roomsError = result.message;
      }
      this.roomsLoading = false;
    },

    async createRoom(name: string) {
      const result = await rooms.createRoom(name);
      if (result.ok) {
        // Surface the new room immediately without a round-trip.
        this.rooms = [result.data, ...this.rooms];
      }
      return result;
    },

    async joinRoom(roomId: string) {
      return rooms.joinRoom(roomId);
    },

    async loadMembers(roomId: string) {
      // Drop the previous room's roster up front so navigating room → room
      // (same component) never flashes stale members while the fetch runs.
      this.members = [];
      this.joined = null;
      this.membersLoading = true;
      this.membersError = null;
      const result = await rooms.listMembers(roomId);
      if (result.ok) {
        this.joined = result.data.joined;
        this.members = result.data.joined ? result.data.members : [];
      } else {
        this.membersError = result.message;
      }
      this.membersLoading = false;
    },
  },
});
