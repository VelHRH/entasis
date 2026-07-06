import * as Schema from "effect/Schema";
import { ChatId, Message } from "../schema.js";

export const MessageBody = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(4000),
);

// Events the client sends over the socket.
export class SendMessage extends Schema.TaggedClass<SendMessage>()(
  "SendMessage",
  {
    chatId: ChatId,
    body: MessageBody,
  },
) {}

export const ClientEvent = Schema.Union(SendMessage);
export type ClientEvent = typeof ClientEvent.Type;

// Events the server pushes to connected clients.
export class MessageReceived extends Schema.TaggedClass<MessageReceived>()(
  "MessageReceived",
  {
    message: Message,
  },
) {}

export class EventRejected extends Schema.TaggedClass<EventRejected>()(
  "EventRejected",
  {
    reason: Schema.String,
  },
) {}

export const ServerEvent = Schema.Union(MessageReceived, EventRejected);
export type ServerEvent = typeof ServerEvent.Type;

// Wire format: JSON text frames.
export const ClientEventFromJson = Schema.parseJson(ClientEvent);
export const ServerEventFromJson = Schema.parseJson(ServerEvent);
