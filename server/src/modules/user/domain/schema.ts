import { Schema } from "effect";

export const UserId = Schema.UUID.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}

// Internal projection that carries the password hash. Never exposed via the API.
export class UserWithCredentials extends Schema.Class<UserWithCredentials>(
  "UserWithCredentials",
)({
  ...User.fields,
  passwordHash: Schema.Redacted(Schema.String),
}) {}
