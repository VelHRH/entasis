import type { RoomNotFoundError } from "@entasis/domain/room/errors";
import type { Room, RoomId } from "@entasis/domain/room/schema";
import type { UpsertRoomPayload } from "@entasis/domain/room/upsert";
import type { UserId } from "@entasis/domain/user/schema";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

// TODO: add a system-level scheduler service that creates rooms itself
// (events run on a fixed schedule per the MVP) by calling this service
// directly, bypassing the API layer — no user/role involved.
export class RoomsService extends Context.Tag("RoomsService")<
  RoomsService,
  {
    readonly list: () => Effect.Effect<ReadonlyArray<Room>>;
    readonly upsert: (input: UpsertRoomPayload) => Effect.Effect<Room, RoomNotFoundError>;
    readonly delete: (id: RoomId) => Effect.Effect<void, RoomNotFoundError>;
    readonly join: (
      roomId: RoomId,
      userId: UserId,
    ) => Effect.Effect<void, RoomNotFoundError>;
  }
>() {}
