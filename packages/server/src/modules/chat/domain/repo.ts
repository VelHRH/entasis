import { Chat, type ChatId, type ChatSummary, Message } from "@landline/domain/chat/schema";
import type { RoomId } from "@landline/domain/room/schema";
import type { UserId } from "@landline/domain/user/schema";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import * as Schema from "effect/Schema";

export const FindDirectChatInput = Schema.Struct({
  roomId: Chat.fields.roomId,
  userA: Message.fields.senderId,
  userB: Message.fields.senderId,
});
export type FindDirectChatInput = typeof FindDirectChatInput.Type;

export const CreateMessageInput = Message.pipe(
  Schema.pick("chatId", "senderId", "body"),
);
export type CreateMessageInput = typeof CreateMessageInput.Type;

export class ChatsRepo extends Context.Tag("ChatsRepo")<
  ChatsRepo,
  {
    readonly findDirect: (
      input: FindDirectChatInput,
    ) => Effect.Effect<Option.Option<Chat>>;
    readonly create: (
      roomId: RoomId,
      members: ReadonlyArray<UserId>,
    ) => Effect.Effect<Chat>;
    /** Empty when the chat does not exist. */
    readonly membersOf: (
      chatId: ChatId,
    ) => Effect.Effect<ReadonlyArray<UserId>>;
    /** The user's direct chats, each paired with its other participant. */
    readonly listSummariesByUser: (
      userId: UserId,
    ) => Effect.Effect<ReadonlyArray<ChatSummary>>;
  }
>() {}

export class MessagesRepo extends Context.Tag("MessagesRepo")<
  MessagesRepo,
  {
    readonly create: (input: CreateMessageInput) => Effect.Effect<Message>;
    readonly listByChat: (
      chatId: ChatId,
    ) => Effect.Effect<ReadonlyArray<Message>>;
  }
>() {}
