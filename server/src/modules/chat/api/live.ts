import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as Effect from "effect/Effect";
import { Api } from "src/api.js";
import { CurrentUser } from "src/modules/user/api/interface.js";
import { ChatService } from "../domain/service.js";

export const ChatsGroupLive = HttpApiBuilder.group(Api, "chats", (handlers) =>
  Effect.gen(function* () {
    const service = yield* ChatService;

    return handlers
      .handle("open", ({ payload }) =>
        Effect.flatMap(CurrentUser, (user) =>
          service.openChat(user.id, payload),
        ),
      )
      .handle("messages", ({ path }) =>
        Effect.flatMap(CurrentUser, (user) =>
          service.listMessages(user.id, path.chatId),
        ),
      );
  }),
);
