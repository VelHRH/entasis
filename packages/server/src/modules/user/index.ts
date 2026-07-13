import * as Layer from "effect/Layer";
import { AuthorizationLive, UsersGroupLive } from "./api/live.js";
import { AuthServiceLive } from "./infrastucture/service.js";

export const UsersModuleLive = UsersGroupLive.pipe(
  Layer.provide(AuthServiceLive),
);

export const AuthorizationModuleLive = AuthorizationLive.pipe(
  Layer.provide(AuthServiceLive),
);
