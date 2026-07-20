import type { ChatNotFoundError } from "@entasis/domain/chat/errors";
import type { OpenChatPayload } from "@entasis/domain/chat/open-chat";
import type { SendMessage } from "@entasis/domain/chat/protocol";
import type { Chat, ChatId, ChatSummary, Message } from "@entasis/domain/chat/schema";
import type { NotRoomMemberError } from "@entasis/domain/room/errors";
import type { UserId } from "@entasis/domain/user/schema";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

export class ChatService extends Context.Tag("ChatService")<
  ChatService,
  {
    /** Finds or creates the direct chat between the user and a partner. */
    readonly openChat: (
      userId: UserId,
      payload: OpenChatPayload,
    ) => Effect.Effect<Chat, NotRoomMemberError>;
    readonly listMessages: (
      userId: UserId,
      chatId: ChatId,
    ) => Effect.Effect<ReadonlyArray<Message>, ChatNotFoundError>;
    /** The user's direct chats for the "my chats" surface. */
    readonly myChats: (
      userId: UserId,
    ) => Effect.Effect<ReadonlyArray<ChatSummary>>;
    /** Persists the message and pushes it to all connected chat members. */
    readonly sendMessage: (
      userId: UserId,
      input: SendMessage,
    ) => Effect.Effect<Message, ChatNotFoundError>;
  }
>() {}
