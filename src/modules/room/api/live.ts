import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as Effect from "effect/Effect";
import { Api } from "src/api.js";
import { RoomsRepo } from "../domain/repo.js";

export const RoomsGroupLive = HttpApiBuilder.group(Api, "rooms", (handlers) =>
  Effect.gen(function* () {
    const repo = yield* RoomsRepo;

    return handlers
      .handle("list", () => repo.findAll())
      .handle("upsert", ({ payload }) =>
        Effect.gen(function* () {
          if (payload.id !== undefined) {
            return yield* repo.update({
              id: payload.id,
              name: payload.name,
            });
          }
          return yield* repo.create({
            name: payload.name,
          });
        }),
      )
      .handle("delete", ({ payload }) => repo.delete(payload.id));
  }),
);
