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

// A listed room plus whether the requesting user has joined it (per-viewer).
export class RoomListItem extends Schema.Class<RoomListItem>("RoomListItem")({
  ...Room.fields,
  joined: Schema.Boolean,
}) {}
