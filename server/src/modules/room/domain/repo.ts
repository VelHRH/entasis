import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type { RoomNotFoundError } from "./errors.js";
import { Room, type RoomId } from "./schema.js";

export const CreateRoomInput = Room.pipe(Schema.pick("name"));
export type CreateRoomInput = typeof CreateRoomInput.Type;

export const UpdateRoomInput = Room.pipe(Schema.pick("id", "name"));
export type UpdateRoomInput = typeof UpdateRoomInput.Type;

export class RoomsRepo extends Context.Tag("RoomsRepo")<
  RoomsRepo,
  {
    readonly findAll: () => Effect.Effect<ReadonlyArray<Room>>;
    readonly create: (input: CreateRoomInput) => Effect.Effect<Room>;
    readonly update: (
      input: UpdateRoomInput,
    ) => Effect.Effect<Room, RoomNotFoundError>;
    readonly delete: (id: RoomId) => Effect.Effect<void, RoomNotFoundError>;
  }
>() {}
