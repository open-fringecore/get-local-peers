import {useEffect, useState} from 'react';
import {activePeersStore, type TActivePeer} from 'get-local-peers';

/**
 * Hook to subscribe to active peers in the local network.
 * Automatically starts and stops the discovery process.
 */
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
