import { HttpApi } from "@effect/platform";
import { RoomsGroup } from "./modules/room/api/interface.js";
import { UsersGroup } from "./modules/user/api/interface.js";

export class Api extends HttpApi.make("Api")
  .add(RoomsGroup)
  .add(UsersGroup)
  .prefix("/api") {}
