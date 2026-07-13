import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import * as Schema from "effect/Schema";
import { Authorization } from "src/modules/user/api/interface.js";
import { OpenChatPayload } from "../domain/dto/open-chat.js";
import { ChatNotFoundError, NotRoomMemberError } from "../domain/errors.js";
import { Chat, ChatId, Message } from "../domain/schema.js";

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
