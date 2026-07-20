import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import { Api } from "@entasis/domain/api";
import { CurrentUser } from "@entasis/domain/user/http";
import * as Effect from "effect/Effect";
import { ChatService } from "../domain/service.js";

export const ChatsGroupLive = HttpApiBuilder.group(Api, "chats", (handlers) =>
  Effect.gen(function*() {
    const service = yield* ChatService;

    return handlers
      .handle("open", ({ payload }) => Effect.flatMap(CurrentUser, (user) => service.openChat(user.id, payload)))
      .handle("myChats", () => Effect.flatMap(CurrentUser, (user) => service.myChats(user.id)))
      .handle("messages", ({ path }) =>
        Effect.flatMap(CurrentUser, (user) => service.listMessages(user.id, path.chatId)));
  }));
