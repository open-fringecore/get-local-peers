import React, {useEffect} from 'react';
import {Text} from 'ink';
import Example from '@/Example.js';
import getLocalInfo from 'get-local-info';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	useEffect(() => {
		const info = getLocalInfo();
		console.log('Local Info:', info);
	}, []);

	return (
		<>
			<Text>
				Hi, <Text color="green">{name}</Text>
			</Text>
			{/* <Example /> */}
		</>
	);
}
