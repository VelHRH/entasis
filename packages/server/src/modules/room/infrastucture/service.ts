import { RoomsRepo } from "#modules/room/domain/repo.js";
import { RoomsService } from "#modules/room/domain/service.js";
import { NotRoomMemberError } from "@entasis/domain/room/errors";
import type { RoomId } from "@entasis/domain/room/schema";
import type { UpsertRoomPayload } from "@entasis/domain/room/upsert";
import type { UserId } from "@entasis/domain/user/schema";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
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

    const members = (roomId: RoomId, requesterId: UserId) =>
      Effect.gen(function*() {
        const membership = yield* repo.membersAmong(roomId, [requesterId]);
        if (membership.length === 0) {
          return yield* new NotRoomMemberError({ roomId });
        }
        return yield* repo.findMembers(roomId);
      });

    return {
      list,
      upsert,
      delete: deleteRoom,
      join,
      members,
    };
  }),
).pipe(Layer.provide(RoomsRepoLive));
