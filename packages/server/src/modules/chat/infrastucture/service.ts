import { ConnectionRegistry } from "#modules/chat/domain/registry.js";
import { ChatsRepo, MessagesRepo } from "#modules/chat/domain/repo.js";
import { ChatService } from "#modules/chat/domain/service.js";
import { RoomsRepo } from "#modules/room/domain/repo.js";
import { RoomsRepoLive } from "#modules/room/infrastucture/repository.js";
import { ChatNotFoundError } from "@landline/domain/chat/errors";
import type { OpenChatPayload } from "@landline/domain/chat/open-chat";
import { MessageReceived, type SendMessage } from "@landline/domain/chat/protocol";
import type { ChatId } from "@landline/domain/chat/schema";
import { NotRoomMemberError } from "@landline/domain/room/errors";
import type { UserId } from "@landline/domain/user/schema";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { ChatsRepoLive, MessagesRepoLive } from "./repository.js";

export const ChatServiceLive = Layer.effect(ChatService)(
  Effect.gen(function*() {
    const chatsRepo = yield* ChatsRepo;
    const messagesRepo = yield* MessagesRepo;
    const roomsRepo = yield* RoomsRepo;
    const registry = yield* ConnectionRegistry;

    const openChat = (userId: UserId, payload: OpenChatPayload) =>
      Effect.gen(function*() {
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
      Effect.gen(function*() {
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

    const myChats = (userId: UserId) => chatsRepo.listSummariesByUser(userId);

    const sendMessage = (userId: UserId, input: SendMessage) =>
      Effect.gen(function*() {
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
      myChats,
      sendMessage,
    };
  }),
).pipe(Layer.provide([ChatsRepoLive, MessagesRepoLive, RoomsRepoLive]));
