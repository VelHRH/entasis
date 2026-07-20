import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";
import { RoomId } from "./schema.js";

export class RoomNotFoundError extends Schema.TaggedError<RoomNotFoundError>(
  "RoomNotFoundError",
)(
  "RoomNotFoundError",
  { id: RoomId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Room with id ${this.id} not found`;
  }
}

// Raised when a user acts on a room they have not joined (opening a chat,
// listing members). 403 rather than 404 because rooms are publicly listable,
// so their existence is not a secret — only their membership is gated.
export class NotRoomMemberError extends Schema.TaggedError<NotRoomMemberError>(
  "NotRoomMemberError",
)(
  "NotRoomMemberError",
  { roomId: RoomId },
  HttpApiSchema.annotations({
    status: 403,
  }),
) {
  get message() {
    return `You must be a member of room ${this.roomId}`;
  }
}
