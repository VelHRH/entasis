import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { UserId } from "src/modules/user/domain/schema.js";
import type { ServerEvent } from "./dto/protocol.js";

// In-memory hashmap of active connections
export class ConnectionRegistry extends Context.Tag("ConnectionRegistry")<
  ConnectionRegistry,
  {
    readonly register: (
      userId: UserId,
      send: (event: ServerEvent) => Effect.Effect<void>,
    ) => Effect.Effect<void, never, Scope.Scope>;

    readonly broadcast: (
      userIds: ReadonlyArray<UserId>,
      event: ServerEvent,
    ) => Effect.Effect<void>;
  }
>() {}
