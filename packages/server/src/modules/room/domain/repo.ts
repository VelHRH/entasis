import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { UserId } from "src/modules/user/domain/schema.js";
import type { RoomNotFoundError } from "./errors.js";
import { Room, RoomId } from "./schema.js";

export const CreateRoomInput = Room.pipe(Schema.pick("name"));
export type CreateRoomInput = typeof CreateRoomInput.Type;

export const UpdateRoomInput = Room.pipe(Schema.pick("id", "name"));
export type UpdateRoomInput = typeof UpdateRoomInput.Type;

export const AddRoomMemberInput = Schema.Struct({
  roomId: RoomId,
  userId: UserId,
});
export type AddRoomMemberInput = typeof AddRoomMemberInput.Type;

export class RoomsRepo extends Context.Tag("RoomsRepo")<
  RoomsRepo,
  {
    readonly findAll: () => Effect.Effect<ReadonlyArray<Room>>;
    readonly create: (input: CreateRoomInput) => Effect.Effect<Room>;
    readonly update: (
      input: UpdateRoomInput,
    ) => Effect.Effect<Room, RoomNotFoundError>;
    readonly delete: (id: RoomId) => Effect.Effect<void, RoomNotFoundError>;
    readonly addMember: (
      input: AddRoomMemberInput,
    ) => Effect.Effect<void, RoomNotFoundError>;
    readonly membersAmong: (
      roomId: RoomId,
      userIds: ReadonlyArray<UserId>,
    ) => Effect.Effect<ReadonlyArray<UserId>>;
  }
>() {}
