import React, {useEffect} from 'react';
import {Text} from 'ink';
import Example from '@/Example.js';
import {greet} from 'get-local-info';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	useEffect(() => {
		console.log(greet('RUSTOM...'));
	}, []);

	return (
		<>
			<Text>
				Hello, <Text color="green">{name}</Text>
			</Text>
			{/* <Example /> */}
		</>
	);
}
