import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { UserId } from "src/modules/user/domain/schema.js";
import type { OpenChatPayload } from "./dto/open-chat.js";
import type { SendMessage } from "./dto/protocol.js";
import type { ChatNotFoundError, NotRoomMemberError } from "./errors.js";
import type { Chat, ChatId, Message } from "./schema.js";

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
    /** Persists the message and pushes it to all connected chat members. */
    readonly sendMessage: (
      userId: UserId,
      input: SendMessage,
    ) => Effect.Effect<Message, ChatNotFoundError>;
  }
>() {}
