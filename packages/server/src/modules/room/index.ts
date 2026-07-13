import * as Layer from "effect/Layer";
import { RoomsGroupLive } from "./api/live.js";
import { RoomsServiceLive } from "./infrastucture/service.js";

export const RoomsModuleLive = RoomsGroupLive.pipe(
  Layer.provide(RoomsServiceLive),
);
