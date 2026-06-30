import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RoomsService } from "../domain/service.js";
import { RoomsRepo } from "../domain/repo.js";
import type { UpsertRoomPayload } from "../domain/dto/upsert.js";
import type { RoomId } from "../domain/schema.js";
import { RoomsRepoLive } from "./repository.js";

export const RoomsServiceLive = Layer.effect(RoomsService)(
  Effect.gen(function* () {
    const repo = yield* RoomsRepo;

    const list = () => repo.findAll();

    const upsert = (payload: UpsertRoomPayload) =>
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
      });

    const deleteRoom = (id: RoomId) => repo.delete(id);

    return {
      list,
      upsert,
      delete: deleteRoom,
    };
  }),
).pipe(Layer.provide(RoomsRepoLive));
