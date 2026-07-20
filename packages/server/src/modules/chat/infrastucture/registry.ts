import { ConnectionRegistry } from "#modules/chat/domain/registry.js";
import type { ServerEvent } from "@entasis/domain/chat/protocol";
import type { UserId } from "@entasis/domain/user/schema";
import * as Effect from "effect/Effect";
import * as HashMap from "effect/HashMap";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";

type Send = (event: ServerEvent) => Effect.Effect<void>;

export const ConnectionRegistryLive = Layer.effect(ConnectionRegistry)(
  Effect.gen(function*() {
    // We have array of sends for each user in case user opened socket from several tabs, so we need update them all simultaneously
    // We use Ref to have ability update HashMap
    const connections = yield* Ref.make(
      HashMap.empty<UserId, ReadonlyArray<Send>>(),
    );

    const sendsOf = (
      map: HashMap.HashMap<UserId, ReadonlyArray<Send>>,
      userId: UserId,
    ) => Option.getOrElse(HashMap.get(map, userId), () => []);

    const register = (userId: UserId, send: Send) =>
      // acquireRelease to autoclean socket after user disconnected
      Effect.acquireRelease(
        Ref.update(connections, (map) => HashMap.set(map, userId, [...sendsOf(map, userId), send])),
        () =>
          Ref.update(connections, (map) => {
            const remaining = sendsOf(map, userId).filter((s) => s !== send);
            return remaining.length === 0
              ? HashMap.remove(map, userId)
              : HashMap.set(map, userId, remaining);
          }),
      ).pipe(Effect.asVoid);

    const broadcast = (userIds: ReadonlyArray<UserId>, event: ServerEvent) =>
      Ref.get(connections).pipe(
        Effect.flatMap((map) =>
          Effect.forEach(
            userIds.flatMap((userId) => sendsOf(map, userId)),
            (send) => send(event),
            { discard: true },
          )
        ),
      );

    return { register, broadcast };
  }),
);
