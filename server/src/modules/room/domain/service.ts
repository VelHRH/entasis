import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { RoomNotFoundError } from "./errors.js";
import type { Room, RoomId } from "./schema.js";
import type { UpsertRoomPayload } from "./dto/upsert.js";

export class RoomsService extends Context.Tag("RoomsService")<
  RoomsService,
  {
    readonly list: () => Effect.Effect<ReadonlyArray<Room>>;
    readonly upsert: (input: UpsertRoomPayload) => Effect.Effect<Room, RoomNotFoundError>;
    readonly delete: (id: RoomId) => Effect.Effect<void, RoomNotFoundError>;
  }
>() {}
