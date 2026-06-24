import { RoomsGroupLive } from "./api/live.js";
import { RoomsRepoLive } from "./infrastucture/repository.js";
import * as Layer from "effect/Layer";

export const RoomsModuleLive = RoomsGroupLive.pipe(
  Layer.provide(RoomsRepoLive),
);
