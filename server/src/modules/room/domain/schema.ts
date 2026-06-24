import { Schema } from "effect";

export const RoomId = Schema.UUID.pipe(Schema.brand("RoomId"));
export type RoomId = typeof RoomId.Type;

export class Room extends Schema.Class<Room>("Room")({
  id: RoomId,
  name: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}
