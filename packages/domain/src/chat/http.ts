import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import * as Schema from "effect/Schema";
import { NotRoomMemberError } from "../room/errors.js";
import { Authorization } from "../user/http.js";
import { ChatNotFoundError } from "./errors.js";
import { OpenChatPayload } from "./open-chat.js";
import { Chat, ChatId, Message } from "./schema.js";

export class ChatsGroup extends HttpApiGroup.make("chats")
  .add(
    HttpApiEndpoint.post("open", "/")
      .setPayload(OpenChatPayload)
      .addSuccess(Chat)
      .addError(NotRoomMemberError),
  )
  .add(
    HttpApiEndpoint.get("messages", "/:chatId/messages")
      .setPath(Schema.Struct({ chatId: ChatId }))
      .addSuccess(Schema.Array(Message))
      .addError(ChatNotFoundError),
  )
  .middleware(Authorization)
  .prefix("/chat")
{}
