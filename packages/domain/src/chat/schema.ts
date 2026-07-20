import { RoomId } from "#room/schema.js";
import { User, UserId } from "#user/schema.js";
import * as Schema from "effect/Schema";

export const ChatId = Schema.UUID.pipe(Schema.brand("ChatId"));
export type ChatId = typeof ChatId.Type;

export class Chat extends Schema.Class<Chat>("Chat")({
  id: ChatId,
  roomId: RoomId,
  createdAt: Schema.DateTimeUtc,
}) {}

// A direct chat plus its other participant, so the "my chats" surface can show
// who each dialog is with without a second round-trip. Direct chats have
// exactly two members, so there is always exactly one partner.
export class ChatSummary extends Schema.Class<ChatSummary>("ChatSummary")({
  id: ChatId,
  roomId: RoomId,
  partner: User,
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
