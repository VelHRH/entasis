import { User } from "@landline/domain/user/schema";
import { Schema } from "effect";

// Internal projection that carries the password hash. Never exposed via the API.
export class UserWithCredentials extends Schema.Class<UserWithCredentials>(
  "UserWithCredentials",
)({
  ...User.fields,
  passwordHash: Schema.Redacted(Schema.String),
}) {}
