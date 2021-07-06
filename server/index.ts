// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { serve } from "https://deno.land/std@0.100.0/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.100.0/ws/mod.ts";
import { decodeJSONMessage, handleEventMessagePacket } from "./event.ts";
import { Map } from "./models/Map.ts";

interface GameState {
  roomState: RoomState;
  map: Map;
}

interface RoomState {
  ready: boolean;
  players: number;
}

const defaultRoomState: RoomState = {
  ready: false,
  players: 0,
};

const defaultGameState: GameState = {
  roomState: defaultRoomState,
  map: {
    tiles: [[]],
  },
};

async function handleWs(sock: WebSocket) {
  console.log("socket connected!");

  try {
    for await (const ev of sock) {
      if (typeof ev === "string") {
        // text message.
        console.log("ws:Text", ev);
        console.log("string received, unexpected");
      } else if (ev instanceof Uint8Array) {
        handleBinaryMessage(ev, sock);
      } else if (isWebSocketPingEvent(ev)) {
        const [, body] = ev;
        // ping.
        console.log("ws:Ping", body);
      } else if (isWebSocketCloseEvent(ev)) {
        // close.
        const { code, reason } = ev;
        console.log("ws:Close", code, reason);
      }
    }
  } catch (err) {
    console.error(`failed to receive frame: ${err}`);

    if (!sock.isClosed) {
      await sock.close(1000).catch(console.error);
    }
  }
}

const handleBinaryMessage = (ev: Uint8Array, sock: WebSocket) => {
  const eventMessagePacket = decodeJSONMessage(ev);
  if (eventMessagePacket) {
    console.log("ws:Binary", eventMessagePacket.eventName);
    handleEventMessagePacket(eventMessagePacket, sock);
  } else {
    console.log("Event received not in event format");
  }
};

if (import.meta.main) {
  /** websocket echo server */
  const port = Deno.args[0] || "8080";
  console.log(`websocket server is running on :${port}`);
  for await (const req of serve(`:${port}`)) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    })
      .then(handleWs)
      .catch(async (err) => {
        console.error(`failed to accept websocket: ${err}`);
        await req.respond({ status: 400 });
      });
  }
}
