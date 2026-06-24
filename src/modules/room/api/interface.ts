import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import * as Schema from "effect/Schema";
import { Room, RoomId } from "../domain/schema.js";
import { RoomNotFoundError } from "../domain/errors.js";
import { UpsertRoomPayload } from "../domain/dto/upsert.js";

export class RoomsGroup extends HttpApiGroup.make("rooms")
  .add(HttpApiEndpoint.get("list", "/").addSuccess(Schema.Array(Room)))
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(Room)
      .addError(RoomNotFoundError)
      .setPayload(UpsertRoomPayload),
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
  .prefix("/room") {}
