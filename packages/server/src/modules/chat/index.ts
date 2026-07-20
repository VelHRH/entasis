import { AuthServiceLive } from "#modules/user/infrastucture/service.js";
import * as Layer from "effect/Layer";
import { ChatsGroupLive } from "./api/live.js";
import { ChatWsRouteLive } from "./api/ws.js";
import { ConnectionRegistryLive } from "./infrastucture/registry.js";
import { ChatServiceLive } from "./infrastucture/service.js";

// Both layers reference the same ChatServiceLive/ConnectionRegistryLive,
// so layer memoization guarantees a single shared instance of each.
export const ChatModuleLive = ChatsGroupLive.pipe(
  Layer.provide(ChatServiceLive),
  Layer.provide(ConnectionRegistryLive),
);

export const ChatWsModuleLive = ChatWsRouteLive.pipe(
  Layer.provide([ChatServiceLive, AuthServiceLive]),
  Layer.provide(ConnectionRegistryLive),
);
