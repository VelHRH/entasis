import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { RoomsRepo } from "src/modules/room/domain/repo.js";
import { RoomsRepoLive } from "src/modules/room/infrastucture/repository.js";
import type { UserId } from "src/modules/user/domain/schema.js";
import type { OpenChatPayload } from "../domain/dto/open-chat.js";
import { MessageReceived, type SendMessage } from "../domain/dto/protocol.js";
import { ChatNotFoundError, NotRoomMemberError } from "../domain/errors.js";
import { ChatsRepo, MessagesRepo } from "../domain/repo.js";
import { ConnectionRegistry } from "../domain/registry.js";
import type { ChatId } from "../domain/schema.js";
import { ChatService } from "../domain/service.js";
import { ChatsRepoLive, MessagesRepoLive } from "./repository.js";

export const ChatServiceLive = Layer.effect(ChatService)(
  Effect.gen(function* () {
    const chatsRepo = yield* ChatsRepo;
    const messagesRepo = yield* MessagesRepo;
    const roomsRepo = yield* RoomsRepo;
    const registry = yield* ConnectionRegistry;

    const openChat = (userId: UserId, payload: OpenChatPayload) =>
      Effect.gen(function* () {
        const members = yield* roomsRepo.membersAmong(payload.roomId, [
          userId,
          payload.partnerId,
        ]);
        if (members.length !== 2) {
          return yield* new NotRoomMemberError({ roomId: payload.roomId });
        }
        const existing = yield* chatsRepo.findDirect({
          roomId: payload.roomId,
          userA: userId,
          userB: payload.partnerId,
        });
        if (Option.isSome(existing)) {
          return existing.value;
        }
        return yield* chatsRepo.create(payload.roomId, [
          userId,
          payload.partnerId,
        ]);
      });

    // Check if the user has rights in the chat
    const requireMembers = (chatId: ChatId, userId: UserId) =>
      Effect.gen(function* () {
        const members = yield* chatsRepo.membersOf(chatId);
        if (!members.includes(userId)) {
          return yield* new ChatNotFoundError({ id: chatId });
        }
        return members;
      });

    const listMessages = (userId: UserId, chatId: ChatId) =>
      requireMembers(chatId, userId).pipe(
        Effect.flatMap(() => messagesRepo.listByChat(chatId)),
      );

    const sendMessage = (userId: UserId, input: SendMessage) =>
      Effect.gen(function* () {
        const members = yield* requireMembers(input.chatId, userId);
        const message = yield* messagesRepo.create({
          chatId: input.chatId,
          senderId: userId,
          body: input.body,
        });
        // The sender receives the event too, to sync their other tabs/devices.
        yield* registry.broadcast(members, new MessageReceived({ message }));
        return message;
      });

    return {
      openChat,
      listMessages,
      sendMessage,
    };
  }),
).pipe(Layer.provide([ChatsRepoLive, MessagesRepoLive, RoomsRepoLive]));
