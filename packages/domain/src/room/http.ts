import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import * as Schema from "effect/Schema";
import { Authorization } from "../user/http.js";
import { User } from "../user/schema.js";
import { NotRoomMemberError, RoomNotFoundError } from "./errors.js";
import { Room, RoomId } from "./schema.js";
import { UpsertRoomPayload } from "./upsert.js";

export class RoomsGroup extends HttpApiGroup.make("rooms")
  .add(HttpApiEndpoint.get("list", "/").addSuccess(Schema.Array(Room)))
  // Only members may read a room's roster, so a non-member cannot enumerate
  // who is inside a room they have not joined.
  .add(
    HttpApiEndpoint.get("members", "/:roomId/members")
      .setPath(Schema.Struct({ roomId: RoomId }))
      .addSuccess(Schema.Array(User))
      .addError(NotRoomMemberError),
  )
  // TODO: once roles exist, creating/updating/deleting rooms via API must be
  // admin-only; regular users only join rooms and chat.
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(Room)
      .addError(RoomNotFoundError)
      .setPayload(UpsertRoomPayload),
  )
  .add(
    HttpApiEndpoint.post("join", "/join")
      .setPayload(
        Schema.Struct({
          id: RoomId,
        }),
      )
      .addSuccess(Schema.Void)
      .addError(RoomNotFoundError),
  )
  .add(
    HttpApiEndpoint.del("delete", "/")
      .setPayload(
        Schema.Struct({
          id: RoomId,
        }),
      )
      .addSuccess(Schema.Void)
      .addError(RoomNotFoundError),
  )
  .middleware(Authorization)
  .prefix("/room")
{}
