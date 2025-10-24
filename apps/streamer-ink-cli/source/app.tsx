import React, {useEffect, useState} from 'react';
import {Text} from 'ink';
import Example from '@/Example.js';
import {localPeersStore, type TDiscoveredPeer} from 'get-local-peers';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	const [items, setItems] = useState<TDiscoveredPeer[]>([]);

	useEffect(() => {
		// Get initial items
		setItems(localPeersStore.getDiscoveredPeer());

		// Subscribe to changes
		const unsubscribe = localPeersStore.subscribe(
			(updatedItems: TDiscoveredPeer[]) => {
				setItems(updatedItems);
			},
		);

		// Start generating items
		localPeersStore.start();

		// Cleanup on unmount
		return () => {
			unsubscribe();
			localPeersStore.stop();
		};
	}, []);

	return (
		<>
			<Text>
				Yooo... <Text color="green">{name}</Text>
			</Text>
			{items.map(item => (
				<Text key={item.id}>
					{item.name} - {item.ip}:{item.httpPort}
				</Text>
			))}
			{/* <Example /> */}
		</>
	);
}
