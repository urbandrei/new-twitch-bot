import React, { useState, useEffect } from 'react';


const socket = new WebSocket('ws://localhost:3001');
socket.onopen = () => {
	console.log('Connected to WebSocket server');
};

socket.onclose = () => {
	console.log('WebSocket connection closed');
};


const Test = () => {
	const [chat, setChat] = useState('');
	socket.onmessage = (event) => {
		const receivedMessage = event.data;
		setChat(receivedMessage);
	};

	return (
		<div>
		<h1>{chat}</h1>
		</div>
	);
}

export default Test;
