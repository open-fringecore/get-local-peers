import React, {useEffect, useState} from 'react';
import {Text} from 'ink';
import Example from '@/Example.js';
import getLocalInfo from 'get-local-info';
import {itemStore, type Item} from 'get-local-peers';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	const [items, setItems] = useState<Item[]>([]);

	useEffect(() => {
		// Get initial items
		setItems(itemStore.getItems());

		// Subscribe to changes
		const unsubscribe = itemStore.subscribe((updatedItems: Item[]) => {
			setItems(updatedItems);
		});

		// Start generating items
		itemStore.start();

		// Cleanup on unmount
		return () => {
			unsubscribe();
			itemStore.stop();
		};
	}, []);

	useEffect(() => {
		const info = getLocalInfo();
		console.log('Local Info:', info);
	}, []);

	return (
		<>
			<Text>
				Yooo... <Text color="green">{name}</Text>
			</Text>
			{items.map(item => (
				<Text key={item.id}>
					{item.value} - {new Date(item.timestamp).toLocaleTimeString()}
				</Text>
			))}
			{/* <Example /> */}
		</>
	);
}
