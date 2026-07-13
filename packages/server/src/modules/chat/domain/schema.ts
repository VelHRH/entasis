import * as Schema from "effect/Schema";
import { RoomId } from "src/modules/room/domain/schema.js";
import { UserId } from "src/modules/user/domain/schema.js";

export const ChatId = Schema.UUID.pipe(Schema.brand("ChatId"));
export type ChatId = typeof ChatId.Type;

export class Chat extends Schema.Class<Chat>("Chat")({
  id: ChatId,
  roomId: RoomId,
  createdAt: Schema.DateTimeUtc,
}) {}

export const MessageId = Schema.UUID.pipe(Schema.brand("MessageId"));
export type MessageId = typeof MessageId.Type;

export class Message extends Schema.Class<Message>("Message")({
  id: MessageId,
  chatId: ChatId,
  senderId: UserId,
  body: Schema.String,
  createdAt: Schema.DateTimeUtc,
}) {}
