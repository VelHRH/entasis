import type { NotRoomMemberError, RoomNotFoundError } from "@entasis/domain/room/errors";
import type { Room, RoomId, RoomListItem } from "@entasis/domain/room/schema";
import type { UpsertRoomPayload } from "@entasis/domain/room/upsert";
import type { User, UserId } from "@entasis/domain/user/schema";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

// TODO: add a system-level scheduler service that creates rooms itself
// (events run on a fixed schedule per the MVP) by calling this service
// directly, bypassing the API layer — no user/role involved.
export class RoomsService extends Context.Tag("RoomsService")<
  RoomsService,
  {
    readonly list: (requesterId: UserId) => Effect.Effect<ReadonlyArray<RoomListItem>>;
    readonly upsert: (input: UpsertRoomPayload) => Effect.Effect<Room, RoomNotFoundError>;
    readonly delete: (id: RoomId) => Effect.Effect<void, RoomNotFoundError>;
    readonly join: (
      roomId: RoomId,
      userId: UserId,
    ) => Effect.Effect<void, RoomNotFoundError>;
    /** Lists a room's members; only members may read the roster. */
    readonly members: (
      roomId: RoomId,
      requesterId: UserId,
    ) => Effect.Effect<ReadonlyArray<User>, NotRoomMemberError>;
  }
>() {}
