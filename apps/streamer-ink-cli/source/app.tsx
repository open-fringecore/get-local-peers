import React, {useEffect, useState} from 'react';
import {Text} from 'ink';
import Example from '@/Example.js';
import {activePeersStore, type TActivePeer} from 'get-local-peers';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	const [activePeers, setActivePeers] = useState<TActivePeer[]>([]);

	useEffect(() => {
		// Get initial items
		setActivePeers(activePeersStore.getActivePeers());

		// Subscribe to changes
		const unsubscribe = activePeersStore.subscribe(
			(updatedItems: TActivePeer[]) => {
				setActivePeers(updatedItems);
			},
		);

		// Start generating items
		activePeersStore.start();

		// Cleanup on unmount
		return () => {
			unsubscribe();
			activePeersStore.stop();
		};
	}, []);

	return (
		<>
			<Text>
				Yooo... <Text color="green">{name}</Text>
			</Text>
			<Text backgroundColor="green" color="white">
				Discovered Peers
			</Text>
			{activePeers.map(item => (
				<Text key={item.id}>
					{item.id} - {item.ip}:{item.httpPort}
				</Text>
			))}
			{/* <Example /> */}
		</>
	);
}
