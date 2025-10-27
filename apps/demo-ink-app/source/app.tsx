import React from 'react';
import {Text} from 'ink';
import {useLocalPeers} from '@/hooks/useLocalPeers.js';

type Props = {
	name?: string;
};

export default function App({name = 'Stranger'}: Props) {
	const activePeers = useLocalPeers();

	return (
		<>
			<Text>
				Yooo... <Text color="green">{name}</Text>
			</Text>
			<Text backgroundColor="green" color="white">
				Discovered Peers
			</Text>
			{activePeers.map(peer => (
				<Text key={peer.id}>
					{peer.id} - {peer.ip}:{peer.httpPort}
				</Text>
			))}
		</>
	);
}
