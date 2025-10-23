import {Box, Text} from 'ink';
import React from 'react';

const Example = () => {
	return (
		<Box flexDirection="column" marginTop={1} gap={1}>
			<Text color="green">I am green</Text>
			<Text color="black" backgroundColor="white">
				I am black on white
			</Text>
			<Text color="#ffffff">I am white</Text>
			<Text bold>I am bold</Text>
			<Text italic>I am italic</Text>
			<Text underline>I am underline</Text>
			<Text strikethrough>I am strikethrough</Text>
			<Text inverse>I am inversed</Text>
		</Box>
	);
};

export default Example;
