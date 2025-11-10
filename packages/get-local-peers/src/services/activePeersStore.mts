import dgram, { Socket } from "dgram";
import { TDiscoveredPeer } from "../index.mjs";
import { TActivePeer } from "../lib/types/types.js";
import { HttpServer } from "./httpRouteHandler.mjs";
import getLocalInfo, { LocalInfo } from "../lib/helper/getLocalInfo.js";
import broadcast from "../lib/helper/broadcast.js";
import { randomUUID } from "crypto";
import { getFreePort } from "../lib/helper/freePort.js";
import { DiscoveredPeersStore } from "./discoveredPeersStore.mjs";

type Listener = (activePeers: TActivePeer[]) => void;

export class ActivePeersStore {
    private activePeers: Map<string, TActivePeer> = new Map();
    private alreadyInitializedPeers: Set<string> = new Set();
    private discoveredPeersStore: DiscoveredPeersStore;
    private listeners: Set<Listener> = new Set();
    private unsubscribeFromDiscovered?: () => void;

    private httpServer?: HttpServer;

    constructor(id: string, localInfo: LocalInfo, freePort: number) {
        if (!localInfo) {
            throw new Error("Unable to get local info");
        }

        this.discoveredPeersStore = new DiscoveredPeersStore(
            id,
            localInfo,
            freePort
        );

        // Subscribe to discovered peers changes
        this.unsubscribeFromDiscovered = this.discoveredPeersStore.subscribe(
            (discoveredPeers) => {
                this.onDiscoveredPeersChange(discoveredPeers);
            }
        );
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(): void {
        this.listeners.forEach((listener) =>
            listener([...this.activePeers.values()])
        );
    }

    pollingPeer(peer: TActivePeer): void {
        fetch(`http://${peer.ip}:${peer.httpPort}/active-peer-alive-check`)
            .then((res) => res.json())
            .then((data) => {
                // Peer is alive, do nothing
                this.pollingPeer(peer);
            })
            .catch((err) => {
                // Remove peer if not reachable
                this.activePeers.delete(peer.id);
                this.notify();
            });
    }

    initActivePeer(peer: TDiscoveredPeer): void {
        fetch(`http://${peer.ip}:${peer.httpPort}/get-active-peer`)
            .then((res) => res.json())
            .then((data) => {
                this.activePeers.set(peer.id, {
                    id: peer.id,
                    name: peer.name,
                    ip: peer.ip,
                    httpPort: peer.httpPort,
                });
                this.alreadyInitializedPeers.add(peer.id);
                this.pollingPeer(peer);
                this.notify();
            })
            .catch((err) => {
                // console.error(
                //     `Error initializing active peer ${peer.name} (${peer.ip}): ${err}`
                // );
            });
    }

    private onDiscoveredPeersChange(discoveredPeers: TDiscoveredPeer[]): void {
        // console.log(`Discovered peers changed. Count: ${discoveredPeers.length}`);

        const notInitializedPeers = [...discoveredPeers.values()].filter(
            (peer) => !this.alreadyInitializedPeers.has(peer.id)
        );
        notInitializedPeers.forEach((peer) => {
            this.initActivePeer(peer);
        });
    }

    getActivePeers(): TActivePeer[] {
        return [...this.activePeers.values()];
    }

    startHttpServer(): void {
        this.httpServer = new HttpServer();

        this.httpServer.get("/", (req, res) => {
            res.json({
                msg: "Hoe!",
            });
        });

        // Use for initial active peer check after discovery
        this.httpServer.get("/get-active-peer", (req, res) => {
            res.json({
                msg: "My server is on.",
            });
        });

        // Use for periodic alive check (each 10 seconds)
        this.httpServer.get("/active-peer-alive-check", (req, res) => {
            setTimeout(() => {
                res.json({ active: true });
            }, 10000);
        });

        const { ip, httpPort } = this.discoveredPeersStore.getPortAndIP();

        this.httpServer.listen(httpPort, ip, () => {
            // console.log(`Server running at http://${ip}:${httpPort}`);
        });
    }

    start(): void {
        this.discoveredPeersStore.start();
        this.startHttpServer();
    }

    stop(): void {
        // Unsubscribe from discovered peers
        if (this.unsubscribeFromDiscovered) {
            this.unsubscribeFromDiscovered();
        }

        this.discoveredPeersStore.stop();

        if (this.httpServer) {
            this.httpServer.close();
        }
    }

    clear(): void {
        this.activePeers.clear();
        this.discoveredPeersStore.clear();
        this.notify();
    }
}
