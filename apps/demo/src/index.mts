import { activePeersStore, type TActivePeer } from "get-local-peers";

function main() {
    // Print initial peers
    const initialPeers = activePeersStore.getActivePeers();
    // console.log("Initial peers:", initialPeers);

    // Subscribe to updates
    const unsubscribe = activePeersStore.subscribe(
        (updatedPeers: TActivePeer[]) => {
            console.clear();
            console.log("🟢 Active peers:", updatedPeers.length);
            updatedPeers.forEach((peer) => {
                console.log(
                    `→ ${peer.name}-${peer.id.split("-").pop()} | ${peer.ip}:${peer.httpPort}`
                );
            });
        }
    );

    // Start discovery
    activePeersStore.start();

    // Stop on exit
    process.on("SIGINT", () => {
        unsubscribe();
        activePeersStore.stop();
        process.exit(0);
    });
}

main();
