import { HttpLayerRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import * as Schema from "effect/Schema";
import type { User } from "src/modules/user/domain/schema.js";
import { AuthService } from "src/modules/user/domain/service.js";
import { ClientEventFromJson, EventRejected, type ServerEvent, ServerEventFromJson } from "../domain/dto/protocol.js";
import { ConnectionRegistry } from "../domain/registry.js";
import { ChatService } from "../domain/service.js";

const decodeClientEvent = Schema.decode(ClientEventFromJson);
const encodeServerEvent = Schema.encode(ServerEventFromJson);

// Browsers cannot set headers on a WebSocket handshake, so web clients authenticate with the session cookie; mobile clients use a Bearer header.
const extractToken = (request: HttpServerRequest.HttpServerRequest) => {
  const cookie = request.cookies["session"];
  if (cookie !== undefined) {
    return cookie;
  }
  const header = request.headers["authorization"];
  return header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;
};

export const ChatWsRouteLive = HttpLayerRouter.use((router) =>
  Effect.gen(function*() {
    const auth = yield* AuthService;
    const chatService = yield* ChatService;
    const registry = yield* ConnectionRegistry;

    // curried function that sets rules how we handle each raw socket incoming event
    // basically it's just delegating work to chatService.sendMessage, but also does raw text decoding + error handling
    const handleFrame =
      (user: User, send: (event: ServerEvent) => Effect.Effect<void>) => (raw: string | Uint8Array) => {
        const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
        return decodeClientEvent(text).pipe(
          Effect.flatMap((event) => chatService.sendMessage(user.id, event)),
          Effect.catchAll((error) => send(new EventRejected({ reason: error.message }))),
        );
      };

    const connect = (user: User) =>
      Effect.gen(function*() {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const socket = yield* request.upgrade;
        const write = yield* socket.writer;
        const send = (event: ServerEvent) => encodeServerEvent(event).pipe(Effect.flatMap(write), Effect.ignore);
        yield* registry.register(user.id, send);
        yield* socket.runRaw(handleFrame(user, send));
        return HttpServerResponse.empty();
      }).pipe(
        Effect.catchTags({
          RequestError: () => Effect.succeed(HttpServerResponse.empty({ status: 400 })),
          // The client closed the connection; nothing left to answer.
          SocketError: () => Effect.succeed(HttpServerResponse.empty()),
        }),
      );

    yield* router.add(
      "GET",
      "/ws",
      Effect.gen(function*() {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const token = extractToken(request);
        if (token === undefined) {
          return HttpServerResponse.empty({ status: 401 });
        }
        return yield* auth.identify(Redacted.make(token)).pipe(
          Effect.flatMap(connect),
          Effect.catchTag("UnauthorizedError", () => Effect.succeed(HttpServerResponse.empty({ status: 401 }))),
        );
      }),
    );
  })
);
