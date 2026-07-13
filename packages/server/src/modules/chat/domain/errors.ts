import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";
import { RoomId } from "src/modules/room/domain/schema.js";
import { ChatId } from "./schema.js";

// Also returned when the chat exists but the user is not a member, so we don't leak which chats exist.
export class ChatNotFoundError extends Schema.TaggedError<ChatNotFoundError>(
  "ChatNotFoundError",
)(
  "ChatNotFoundError",
  { id: ChatId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Chat with id ${this.id} not found`;
  }
}

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
    return `Both users must be members of room ${this.roomId}`;
  }
}
