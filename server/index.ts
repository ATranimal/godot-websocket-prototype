// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { serve } from "https://deno.land/std@0.100.0/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.100.0/ws/mod.ts";
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
        await sock.send(ev);
      } else if (ev instanceof Uint8Array) {
        // binary message.
        const JSONMessage = decodeJSONMessage(ev);
        console.log("ws:Binary", JSONMessage);
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

const decodeJSONMessage = (ev: Uint8Array): any => {
  const utf8decoder = new TextDecoder();

  const str = utf8decoder.decode(ev);

  return JSON.parse(str);
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
