import {
  ClientEvent,
  ClientEventFromJson,
  ServerEventFromJson,
} from "@entasis/domain/chat/protocol";
import { Either, Schema } from "effect";
import type { MessageView } from "./chat.service";
import { toMessageView } from "./chat.service";

// The live half of the conversation vertical. Effect stays in this service
// file (ADR-0002): it uses the shared protocol schemas to validate every
// frame, then hands the store plain data through callbacks. The transport
// itself is the browser-native WebSocket — long-lived and imperative, it does
// not fit the one-shot runApi shape, and native reconnect is simpler and more
// robust here than driving a socket through the Effect runtime.

const decodeServerEvent = Schema.decodeUnknownEither(ServerEventFromJson);
const buildClientEvent = Schema.decodeUnknownEither(ClientEvent);
const encodeClientEvent = Schema.encodeSync(ClientEventFromJson);

export interface ChatSocketHandlers {
  readonly onMessage: (message: MessageView) => void;
  readonly onRejected: (reason: string) => void;
  readonly onConnectedChange: (connected: boolean) => void;
}

export interface ChatSocket {
  /** Sends a message; false if the socket is not open or the input is invalid. */
  readonly send: (chatId: string, body: string) => boolean;
  readonly close: () => void;
}

const MAX_BACKOFF_MS = 15_000;

const socketUrl = () => {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  // Relative to the current origin: the Vite dev proxy (and the prod reverse
  // proxy) forward /ws, keeping the session cookie first-party.
  return `${protocol}://${location.host}/ws`;
};

export const connectChatSocket = (handlers: ChatSocketHandlers): ChatSocket => {
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    const socket = new WebSocket(socketUrl());
    ws = socket;

    socket.onopen = () => {
      attempt = 0;
      handlers.onConnectedChange(true);
    };

    socket.onmessage = (event) => {
      const decoded = decodeServerEvent(event.data);
      if (Either.isLeft(decoded)) return; // ignore frames outside the protocol
      const serverEvent = decoded.right;
      if (serverEvent._tag === "MessageReceived") {
        handlers.onMessage(toMessageView(serverEvent.message));
      } else {
        handlers.onRejected(serverEvent.reason);
      }
    };

    socket.onclose = () => {
      ws = null;
      handlers.onConnectedChange(false);
      if (!closedByUser) scheduleReconnect();
    };

    // An error is always followed by a close; let onclose drive reconnection.
    socket.onerror = () => socket.close();
  };

  const scheduleReconnect = () => {
    const delay = Math.min(1_000 * 2 ** attempt, MAX_BACKOFF_MS);
    attempt += 1;
    reconnectTimer = setTimeout(open, delay);
  };

  const send = (chatId: string, body: string) => {
    if (ws === null || ws.readyState !== WebSocket.OPEN) return false;
    // Validate against the shared schema (uuid brand, non-empty body) before
    // it hits the wire; the server validates again and may still reject.
    const event = buildClientEvent({ _tag: "SendMessage", chatId, body });
    if (Either.isLeft(event)) return false;
    ws.send(encodeClientEvent(event.right));
    return true;
  };

  const close = () => {
    closedByUser = true;
    if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
  };

  open();
  return { send, close };
};
