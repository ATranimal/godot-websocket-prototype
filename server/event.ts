import { WebSocket } from "https://deno.land/std@0.100.0/ws/mod.ts";

interface EventMessagePacket {
  eventName: string;
  body: Record<string, unknown>;
}

const messageTypes = new Map([
  ["playerReady", null],
  ["startGame", null],
]);

export const decodeJSONMessage = (
  ev: Uint8Array
): EventMessagePacket | null => {
  const utf8decoder = new TextDecoder();

  const str = utf8decoder.decode(ev);
  const jsonObj: EventMessagePacket = JSON.parse(str);

  console.log(jsonObj);
  // validate json shape
  if (
    "eventName" in jsonObj &&
    "body" in jsonObj &&
    messageTypes.has(jsonObj.eventName)
  ) {
    return jsonObj;
  } else {
    return null;
  }
};

export const handleEventMessagePacket = (
  event: EventMessagePacket,
  sock: WebSocket
) => {
  switch (event.eventName) {
    case "playerReady":
      console.log("player ready");
      sock.send("playerReady");
      break;
    case "startGame":
      console.log("start game");
      sock.send("startGame");
      break;
    default:
      break;
  }
};
