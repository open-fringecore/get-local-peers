# get-local-peers

An open source javascript library to get local network peers.

# Usage

### With Node.js
```javascript
import { activePeersStore, type TActivePeer } from "get-local-peers";

// Print initial peers
    const initialPeers = activePeersStore.getActivePeers();
    console.log("Initial peers:", initialPeers);

    // Subscribe to updates
    const unsubscribe = activePeersStore.subscribe(
        (updatedPeers: TActivePeer[]) => {
            console.clear();
            console.log("🟢 Active peers:", updatedPeers.length);
            updatedPeers.forEach((peer) => {
                console.log(`→ ${peer.id} | ${peer.ip}:${peer.httpPort}`);
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
```

#### With React/Ink
```javascript

import {useEffect, useState} from 'react';
import {activePeersStore, type TActivePeer} from 'get-local-peers';

export function useLocalPeers() {
	const [activePeers, setActivePeers] = useState<TActivePeer[]>([]);

	useEffect(() => {
		// Get initial peers
		setActivePeers(activePeersStore.getActivePeers());

		// Subscribe to peer updates
		const unsubscribe = activePeersStore.subscribe((updated: TActivePeer[]) => {
			setActivePeers(updated);
		});

		// Start discovering peers
		activePeersStore.start();

		// Cleanup
		return () => {
			unsubscribe();
			activePeersStore.stop();
		};
	}, []);

	return activePeers;
}


const activePeers = useLocalPeers();
```