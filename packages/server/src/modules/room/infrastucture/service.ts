import type { RoomId } from "@entasis/domain/room/schema";
import type { UpsertRoomPayload } from "@entasis/domain/room/upsert";
import type { UserId } from "@entasis/domain/user/schema";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RoomsRepo } from "../domain/repo.js";
import { RoomsService } from "../domain/service.js";
import { RoomsRepoLive } from "./repository.js";

export const RoomsServiceLive = Layer.effect(RoomsService)(
  Effect.gen(function*() {
    const repo = yield* RoomsRepo;

    const list = () => repo.findAll();

    const upsert = (payload: UpsertRoomPayload) =>
      Effect.gen(function*() {
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

    const join = (roomId: RoomId, userId: UserId) => repo.addMember({ roomId, userId });

    return {
      list,
      upsert,
      delete: deleteRoom,
      join,
    };
  }),
).pipe(Layer.provide(RoomsRepoLive));
