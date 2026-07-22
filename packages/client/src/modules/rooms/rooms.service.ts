import type { RoomListItem } from "@landline/domain/room/schema";
import { RoomId } from "@landline/domain/room/schema";
import type { User } from "@landline/domain/user/schema";
import { Effect, Schema } from "effect";
import type { ApiResult } from "@/lib/api-client";
import { err, ok, runApi } from "@/lib/api-client";

// Plain views handed to the store/components: no branded ids, no Effect
// DateTime — components work with strings only (ADR-0002).
export interface RoomView {
  readonly id: string;
  readonly name: string;
  // Whether the current user has already joined this room.
  readonly joined: boolean;
}

export interface RoomMember {
  readonly id: string;
  readonly email: string;
}

// Whether the current user is inside the room decides what the detail screen
// shows, so "not a member" is a real answer, not an error (mirrors how the
// session service maps Unauthorized to a logged-out state).
export type MembersView =
  | { readonly joined: true; readonly members: ReadonlyArray<RoomMember> }
  | { readonly joined: false };

const toRoomView = (room: RoomListItem): RoomView => ({
  id: room.id,
  name: room.name,
  joined: room.joined,
});

const toRoomMember = (user: User): RoomMember => ({ id: user.id, email: user.email });

export const listRooms = (): Promise<ApiResult<ReadonlyArray<RoomView>>> =>
  runApi((client) =>
    client.rooms.list().pipe(
      Effect.map((rooms) => ok(rooms.map(toRoomView))),
      Effect.catchAll(() => Effect.succeed(err("Couldn't load rooms, try again"))),
    ),
  );

// Dev-only stopgap until roles exist: any authenticated user can create a room.
export const createRoom = (name: string): Promise<ApiResult<RoomView>> =>
  runApi((client) =>
    client.rooms.upsert({ payload: { name } }).pipe(
      // Creating a room does not join it, so it starts un-joined.
      Effect.map((room) => ok<RoomView>({ id: room.id, name: room.name, joined: false })),
      Effect.catchAll(() => Effect.succeed(err("Couldn't create the room, try again"))),
    ),
  );

export const joinRoom = (roomId: string): Promise<ApiResult<void>> =>
  runApi((client) =>
    Schema.decodeUnknown(RoomId)(roomId).pipe(
      Effect.flatMap((id) => client.rooms.join({ payload: { id } })),
      Effect.as(ok<void>(undefined)),
      Effect.catchTag("RoomNotFoundError", () => Effect.succeed(err("This room no longer exists"))),
      Effect.catchAll(() => Effect.succeed(err("Couldn't join the room, try again"))),
    ),
  );

export const listMembers = (roomId: string): Promise<ApiResult<MembersView>> =>
  runApi((client) =>
    Schema.decodeUnknown(RoomId)(roomId).pipe(
      Effect.flatMap((id) => client.rooms.members({ path: { roomId: id } })),
      Effect.map((members): MembersView => ({ joined: true, members: members.map(toRoomMember) })),
      // The one gated answer: a non-member gets the "join first" state, never
      // the roster.
      Effect.catchTag("NotRoomMemberError", () => Effect.succeed<MembersView>({ joined: false })),
      Effect.map(ok),
      Effect.catchAll(() => Effect.succeed(err("Couldn't load members, try again"))),
    ),
  );
