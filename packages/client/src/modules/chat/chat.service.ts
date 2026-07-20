import { OpenChatPayload } from "@entasis/domain/chat/open-chat";
import type { ChatSummary, Message } from "@entasis/domain/chat/schema";
import { ChatId } from "@entasis/domain/chat/schema";
import { DateTime, Effect, Schema } from "effect";
import type { ApiResult } from "../../lib/api-client";
import { err, ok, runApi } from "../../lib/api-client";

// Plain views for the store/components: no branded ids, no Effect DateTime.
export interface MessageView {
  readonly id: string;
  readonly chatId: string;
  readonly senderId: string;
  readonly body: string;
  readonly createdAt: string;
}

export interface ChatSummaryView {
  readonly id: string;
  readonly roomId: string;
  readonly partnerId: string;
  readonly partnerEmail: string;
}

export const toMessageView = (message: Message): MessageView => ({
  id: message.id,
  chatId: message.chatId,
  senderId: message.senderId,
  body: message.body,
  createdAt: DateTime.formatIso(message.createdAt),
});

const toChatSummaryView = (chat: ChatSummary): ChatSummaryView => ({
  id: chat.id,
  roomId: chat.roomId,
  partnerId: chat.partner.id,
  partnerEmail: chat.partner.email,
});

// Finds or creates the direct chat with a room partner (idempotent server-side).
export const openChat = (roomId: string, partnerId: string): Promise<ApiResult<string>> =>
  runApi((client) =>
    Schema.decodeUnknown(OpenChatPayload)({ roomId, partnerId }).pipe(
      Effect.flatMap((payload) => client.chats.open({ payload })),
      Effect.map((chat) => ok<string>(chat.id)),
      Effect.catchTag("NotRoomMemberError", () =>
        Effect.succeed(err("You must be a room member to start a chat")),
      ),
      Effect.catchAll(() => Effect.succeed(err("Couldn't open the chat, try again"))),
    ),
  );

export const listMessages = (chatId: string): Promise<ApiResult<ReadonlyArray<MessageView>>> =>
  runApi((client) =>
    Schema.decodeUnknown(ChatId)(chatId).pipe(
      Effect.flatMap((id) => client.chats.messages({ path: { chatId: id } })),
      Effect.map((messages) => ok(messages.map(toMessageView))),
      Effect.catchTag("ChatNotFoundError", () => Effect.succeed(err("This chat is not available"))),
      Effect.catchAll(() => Effect.succeed(err("Couldn't load messages, try again"))),
    ),
  );

export const myChats = (): Promise<ApiResult<ReadonlyArray<ChatSummaryView>>> =>
  runApi((client) =>
    client.chats.myChats().pipe(
      Effect.map((chats) => ok(chats.map(toChatSummaryView))),
      Effect.catchAll(() => Effect.succeed(err("Couldn't load your chats, try again"))),
    ),
  );
