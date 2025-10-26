import { randomUUID } from "crypto";
import dgram, { Socket } from "dgram";
import http from "http";
import getLocalInfo, { LocalInfo } from "./lib/helper/getLocalInfo.js";
import { getFreePort } from "./lib/helper/freePort.js";
import broadcast from "./lib/helper/broadcast.js";
import { HttpServer } from "./services/httpRouteHandler.mjs";
import { TActivePeer, TDiscoveredPeer } from "./lib/types/types.js";
import { ActivePeersStore } from "./services/activePeersStore.mjs";

// Export singleton instance
const id = randomUUID();
const localInfo = getLocalInfo();
const freePort = (await getFreePort()) ?? 8779;
export const activePeersStore = new ActivePeersStore(id, localInfo, freePort);
export type { TDiscoveredPeer, TActivePeer };
