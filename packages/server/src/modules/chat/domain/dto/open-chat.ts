import * as Schema from "effect/Schema";
import { RoomId } from "src/modules/room/domain/schema.js";
import { UserId } from "src/modules/user/domain/schema.js";

export const OpenChatPayload = Schema.Struct({
  roomId: RoomId,
  partnerId: UserId,
});
export type OpenChatPayload = typeof OpenChatPayload.Type;
