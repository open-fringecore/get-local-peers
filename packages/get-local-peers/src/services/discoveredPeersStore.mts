import dgram, { Socket } from "dgram";
import { TDiscoveredPeer } from "../index.mjs";
import { LocalInfo } from "../lib/helper/getLocalInfo.js";
import broadcast from "../lib/helper/broadcast.js";

type Listener = (items: TDiscoveredPeer[]) => void;

export class DiscoveredPeersStore {
    private discoveredPeer: Map<string, TDiscoveredPeer> = new Map();
    private listeners: Set<Listener> = new Set();

    private udpServer: Socket | null = null;
    private MY_ID: string;
    private MY_IP: string;
    private MY_NAME: string;
    private BROADCAST_ADDR: string;
    private MY_UDP_PORT: number = 8008; // BOOB
    private MY_HTTP_PORT: number;

    constructor(id: string, localInfo: LocalInfo, freePort: number) {
        if (!localInfo) {
            throw new Error("Unable to get local info");
        }
        this.MY_ID = id;
        this.MY_IP = localInfo.ip;
        this.MY_NAME = localInfo.hostname;
        this.BROADCAST_ADDR = localInfo.broadcastIp;
        this.MY_HTTP_PORT = freePort;
    }

    getPortAndIP(): { ip: string; httpPort: number } {
        return {
            ip: this.MY_IP,
            httpPort: this.MY_HTTP_PORT,
        };
    }

    // Subscribe to changes
    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    // Notify all listeners
    private notify(): void {
        this.listeners.forEach((listener) =>
            listener([...this.discoveredPeer.values()])
        );
    }

    // Get current Discovered Peers
    getDiscoveredPeers(): TDiscoveredPeer[] {
        return [...this.discoveredPeer.values()];
    }

    startUDPServer(): void {
        this.udpServer = dgram.createSocket({
            type: "udp4",
            reuseAddr: true,
        });

        this.udpServer.bind({
            port: this.MY_UDP_PORT,
            address: "0.0.0.0",
            exclusive: false,
        });

        const msg = {
            method: "SELF",
            name: this.MY_NAME,
            id: this.MY_ID,
            ip: this.MY_IP,
            httpPort: this.MY_HTTP_PORT,
            isBroadcast: true,
        };

        // Handle server listening event
        this.udpServer.on("listening", () => {
            if (!this.udpServer) throw new Error("Server not initialized");

            const address = this.udpServer.address();
            console.log(`Listening on ${address.address}:${address.port}`);
            this.udpServer.setBroadcast(true);

            // Initial broadcast to announce presence
            broadcast(
                this.udpServer,
                this.BROADCAST_ADDR,
                this.MY_UDP_PORT,
                JSON.stringify(msg)
            );
        });

        // Handle incoming messages
        this.udpServer.on("message", (receivedMsg, rinfo) => {
            try {
                if (!this.udpServer) throw new Error("Server not initialized");

                const data = JSON.parse(receivedMsg.toString());

                // Ignore messages from self
                if (data.id === this.MY_ID) {
                    return;
                }

                // if (data.isBroadcast) {
                //     console.log(`<-- Broadcast From: ${data.name}: ${data.id}`);
                // } else {
                //     console.log(`<-- Received From: ${data.name}: ${data.id}`);
                // }

                // Handle SELF method (peer discovery)
                if (data.method === "SELF") {
                    const isNewPeer = this.addDiscoveredPeer({
                        id: data.id,
                        ip: rinfo.address,
                        name: data.name,
                        httpPort: data.httpPort,
                    });

                    // Respond if it's a new peer or if it was a broadcast
                    if (isNewPeer || data.isBroadcast) {
                        const response = JSON.stringify({
                            ...msg,
                            isBroadcast: false,
                        });

                        this.udpServer.send(
                            response,
                            rinfo.port,
                            rinfo.address
                        );
                    }
                }
            } catch (err) {
                console.error(err);
            }
        });

        this.udpServer.on("error", (err) => {
            console.error(`Server error:\n${err.stack}`);
            this.stop();
        });
    }

    // Add discovered peer (returns false if already exists)
    addDiscoveredPeer(peer: TDiscoveredPeer): boolean {
        if (this.discoveredPeer.has(peer.id)) {
            return false;
        }
        this.discoveredPeer.set(peer.id, peer);
        this.notify();
        console.log(`Added peer: ${peer.name} (${peer.id})`);
        return true;
    }

    start(): void {
        this.startUDPServer();
    }

    stop(): void {
        if (this.udpServer) {
            this.udpServer.close();
            console.log("UDP Server closed");
        }
    }

    clear(): void {
        this.discoveredPeer = new Map();
        this.notify();
    }
}
