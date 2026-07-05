import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Redacted from "effect/Redacted";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import {
  AuthResult,
  type CredentialsPayload,
} from "../domain/dto/credentials.js";
import {
  InvalidCredentialsError,
  UnauthorizedError,
} from "../domain/errors.js";
import { SessionsRepo, UsersRepo } from "../domain/repo.js";
import { User, type UserId } from "../domain/schema.js";
import { AuthService, SESSION_TTL } from "../domain/service.js";
import { SessionsRepoLive, UsersRepoLive } from "./repository.js";

const KEY_LENGTH = 64;

// Stored as "<salt>:<derived key>", both hex-encoded.
const hashPassword = (password: string) =>
  Effect.async<string>((resume) => {
    const salt = randomBytes(16);
    scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        resume(Effect.die(error));
      } else {
        resume(
          Effect.succeed(
            `${salt.toString("hex")}:${derivedKey.toString("hex")}`,
          ),
        );
      }
    });
  });

const verifyPassword = (password: string, storedHash: string) =>
  Effect.async<boolean>((resume) => {
    const [saltHex, keyHex] = storedHash.split(":");
    if (saltHex === undefined || keyHex === undefined) {
      return resume(Effect.succeed(false));
    }
    scrypt(
      password,
      Buffer.from(saltHex, "hex"),
      KEY_LENGTH,
      (error, derivedKey) => {
        if (error) {
          resume(Effect.die(error));
        } else {
          resume(
            Effect.succeed(
              timingSafeEqual(Buffer.from(keyHex, "hex"), derivedKey),
            ),
          );
        }
      },
    );
  });

export const AuthServiceLive = Layer.effect(AuthService)(
  Effect.gen(function* () {
    const usersRepo = yield* UsersRepo;
    const sessionsRepo = yield* SessionsRepo;

    // TODO: maybe move to JWT in the future
    const startSession = (user: User) =>
      Effect.gen(function* () {
        const token = randomBytes(32).toString("base64url");
        const now = yield* DateTime.now;
        yield* sessionsRepo.create({
          token,
          userId: user.id,
          expiresAt: DateTime.addDuration(now, SESSION_TTL),
        });
        return new AuthResult({ token, user });
      });

    const signUp = (payload: CredentialsPayload) =>
      Effect.gen(function* () {
        const passwordHash = yield* hashPassword(
          Redacted.value(payload.password),
        );
        const user = yield* usersRepo.create({
          email: payload.email,
          passwordHash: Redacted.make(passwordHash),
        });
        return yield* startSession(user);
      });

    const login = (payload: CredentialsPayload) =>
      Effect.gen(function* () {
        const found = yield* usersRepo.findByEmail(payload.email);
        if (Option.isNone(found)) {
          return yield* new InvalidCredentialsError();
        }
        const isValid = yield* verifyPassword(
          Redacted.value(payload.password),
          Redacted.value(found.value.passwordHash),
        );
        if (!isValid) {
          return yield* new InvalidCredentialsError();
        }
        const { passwordHash: _, ...user } = found.value;
        return yield* startSession(new User(user));
      });

    const identify = (token: Redacted.Redacted<string>) =>
      sessionsRepo.findUser(Redacted.value(token)).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () => new UnauthorizedError(),
            onSome: Effect.succeed,
          }),
        ),
      );

    const logout = (userId: UserId) => sessionsRepo.deleteAllForUser(userId);

    return {
      signUp,
      login,
      identify,
      logout,
    };
  }),
).pipe(Layer.provide([UsersRepoLive, SessionsRepoLive]));
