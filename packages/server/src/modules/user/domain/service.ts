import type { CredentialsPayload } from "@entasis/domain/user/credentials";
import type { EmailAlreadyInUseError, InvalidCredentialsError, UnauthorizedError } from "@entasis/domain/user/errors";
import type { User, UserId } from "@entasis/domain/user/schema";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import type * as Effect from "effect/Effect";
import type * as Redacted from "effect/Redacted";
import type { AuthResult } from "./dto/auth-result.js";

export const SESSION_TTL = Duration.days(30);

export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    readonly signUp: (
      payload: CredentialsPayload,
    ) => Effect.Effect<AuthResult, EmailAlreadyInUseError>;
    readonly login: (
      payload: CredentialsPayload,
    ) => Effect.Effect<AuthResult, InvalidCredentialsError>;
    readonly identify: (
      token: Redacted.Redacted<string>,
    ) => Effect.Effect<User, UnauthorizedError>;
    readonly logout: (userId: UserId) => Effect.Effect<void>;
  }
>() {}
