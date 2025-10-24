import { randomUUID } from "crypto";
import getLocalInfo, { LocalInfo } from "./lib/helper/getLocalInfo.js";
import { getFreePort } from "./lib/helper/freePort.js";

type TDiscoveredPeer = {
    id: string;
    name: string;
    ip: string;
    httpPort: number;
};

type Listener = (items: TDiscoveredPeer[]) => void;

class LocalPeersStore {
    private discoveredPeer: TDiscoveredPeer[] = [];
    private listeners: Set<Listener> = new Set();

    private MY_ID: string;
    private MY_IP: string;
    private MY_NAME: string;
    private MY_BROADCAST_ADDR: string;
    private MY_UDP_PORT: number = 8008; // BOOB
    private MY_HTTP_PORT: number;

    constructor(id: string, localInfo: LocalInfo, freePort: number) {
        if (!localInfo) {
            throw new Error("Unable to get local info");
        }
        this.MY_ID = id;
        this.MY_IP = localInfo.ip;
        this.MY_NAME = localInfo.hostname;
        this.MY_BROADCAST_ADDR = localInfo.broadcastIp;
        this.MY_HTTP_PORT = freePort;
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
            listener([...this.discoveredPeer])
        );
    }

    // Get current Discovered Peers
    getDiscoveredPeer(): TDiscoveredPeer[] {
        return [...this.discoveredPeer];
    }

    // Start generating items
    start(): void {
        // this.items.push(newItem);
        // this.notify();
    }

    // Stop generating items
    stop(): void {}

    // Clear all items
    clear(): void {
        this.discoveredPeer = [];
        this.notify();
    }
}

// Export singleton instance

const id = randomUUID();
const localInfo = getLocalInfo();
const freePort = (await getFreePort()) ?? 8779;
export const itemStore = new LocalPeersStore(id, localInfo, freePort);
export type { TDiscoveredPeer };
