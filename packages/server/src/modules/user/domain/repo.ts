import type { EmailAlreadyInUseError } from "@entasis/domain/user/errors";
import { User, type UserId } from "@entasis/domain/user/schema";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { UserWithCredentials } from "./schema.js";

export const CreateUserInput = UserWithCredentials.pipe(
  Schema.pick("email", "passwordHash"),
);
export type CreateUserInput = typeof CreateUserInput.Type;

export const CreateSessionInput = Schema.Struct({
  tokenHash: Schema.String,
  userId: User.fields.id,
  expiresAt: Schema.DateTimeUtc,
});
export type CreateSessionInput = typeof CreateSessionInput.Type;

export class UsersRepo extends Context.Tag("UsersRepo")<
  UsersRepo,
  {
    readonly create: (
      input: CreateUserInput,
    ) => Effect.Effect<User, EmailAlreadyInUseError>;
    readonly findByEmail: (
      email: string,
    ) => Effect.Effect<Option.Option<UserWithCredentials>>;
  }
>() {}

export class SessionsRepo extends Context.Tag("SessionsRepo")<
  SessionsRepo,
  {
    readonly create: (input: CreateSessionInput) => Effect.Effect<void>;
    readonly findUser: (
      tokenHash: string,
    ) => Effect.Effect<Option.Option<User>>;
    readonly deleteAllForUser: (userId: UserId) => Effect.Effect<void>;
  }
>() {}
