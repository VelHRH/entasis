import * as Schema from "effect/Schema";
import { RoomId } from "../schema.js";

export class UpsertRoomPayload extends Schema.Class<UpsertRoomPayload>(
  "UpsertRoomPayload",
)({
  id: Schema.optional(RoomId),
  name: Schema.Trim.pipe(
    Schema.nonEmptyString({
      message: () => "Name is required",
    }),
    Schema.maxLength(100, {
      message: () => "Name must be at most 100 characters long",
    }),
  ),
}) {}
