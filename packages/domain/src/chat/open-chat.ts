import { RoomId } from "#room/schema.js";
import { UserId } from "#user/schema.js";
import * as Schema from "effect/Schema";

export const OpenChatPayload = Schema.Struct({
  roomId: RoomId,
  partnerId: UserId,
});
export type OpenChatPayload = typeof OpenChatPayload.Type;
