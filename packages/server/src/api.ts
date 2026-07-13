import { HttpApi } from "@effect/platform";
import { ChatsGroup } from "./modules/chat/api/interface.js";
import { RoomsGroup } from "./modules/room/api/interface.js";
import { UsersGroup } from "./modules/user/api/interface.js";

export class Api extends HttpApi.make("Api")
  .add(RoomsGroup)
  .add(UsersGroup)
  .add(ChatsGroup)
  .prefix("/api")
{}
