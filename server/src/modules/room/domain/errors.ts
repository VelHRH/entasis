import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";
import { RoomId } from "./schema.js";

export class RoomNotFoundError extends Schema.TaggedError<RoomNotFoundError>(
  "RoomNotFoundError",
)(
  "RoomNotFoundError",
  { id: RoomId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Room with id ${this.id} not found`;
  }
}
