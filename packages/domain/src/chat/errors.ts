import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";
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
