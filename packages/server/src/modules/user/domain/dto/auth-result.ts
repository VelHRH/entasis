import { User } from "@landline/domain/user/schema";
import * as Schema from "effect/Schema";

// Internal result of a successful sign-up/login: the session token plus the
// authenticated user. The API layer decides whether the token travels in the
// response body (mobile) or in an httpOnly cookie (web).
export class AuthResult extends Schema.Class<AuthResult>("AuthResult")({
  token: Schema.String,
  user: User,
}) {}
