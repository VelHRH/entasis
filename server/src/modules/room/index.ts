import { RoomsGroupLive } from "./api/live.js";
import { RoomsServiceLive } from "./infrastucture/service.js";
import * as Layer from "effect/Layer";

export const RoomsModuleLive = RoomsGroupLive.pipe(
  Layer.provide(RoomsServiceLive),
);
