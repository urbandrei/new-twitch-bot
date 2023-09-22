const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.SERVER_PORT || 5000;
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({path: "../.env"});
var token = '';
const messages = {all:[]};

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on('connection', (ws) => {
	console.log('Client connected');
	
	ws.on('close', () => {
		console.log('Client disconnected');
	});
});

server.listen(3001, () => {
  console.log('WebSocket server is listening on port 3001');
});

const tws = new WebSocket('ws://irc-ws.chat.twitch.tv:80');

tws.on('error', function(error) {
	console.log('Connect error: ' + error.toString());
});

tws.on('open', function(connection) {
	console.log('WebSocket Client Connected');
	tws.on('error', function(error) {
		console.log("Connection Error: " + error.toString());
	});

	tws.on('close', function() {
		console.log('Connection Closed');
		tws.close();
	});

	tws.on('message', function(ircMessage) {
		let mes = ircMessage.toString().trimEnd();
		if (mes.includes("PRIVMSG")) {
			let id = mes.substring(mes.indexOf('user-id=')+8).split(';')[0];
			let message = mes.substring(mes.lastIndexOf(":")+1);
			wss.clients.forEach((client) => {
                		if (client.readyState === WebSocket.OPEN) {
                        		client.send(JSON.stringify({user_id:id,mess:message,}));
                		}
			});
		}
	});
});

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

app.post('/code', (req, res) => {
        var code = req.body.data;
        fetch('https://id.twitch.tv/oauth2/token',{
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                        'client_id': 'b8jwg17sm2o45ad8wuqc8r4uj4ms3h',
                        'client_secret': process.env.REACT_APP_TWITCH_CLIENT_SECRET,
                        'code': code,
                        'grant_type': 'authorization_code',
                        'redirect_uri': 'http://localhost:3000',
                }),
        })
        .then((response) => response.json())
        .then((data) => {token = data.access_token})
	.then((data) => {
		console.log("Connecting to Twitch...");
		tws.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
        	tws.send(`PASS oauth:`+token);
        	tws.send(`NICK urbandrei`);
        	tws.send('JOIN #urbandrei');
	})
        .catch((error) => {
                console.error('Error:',error.message);
        });
});

app.get('/users', (req, res) => {
        console.log("REQUEST: /users");
        fetch('https://api.twitch.tv/helix/chat/chatters?broadcaster_id=590777735&moderator_id=590777735', {
                method: 'GET',
                headers: {
                        'Authorization': ('Bearer ' + token),
                        'Client-Id': 'b8jwg17sm2o45ad8wuqc8r4uj4ms3h',
                },
        })
        .then((response) => response.json())
        .then((data) => res.json(data))
        .catch((error) => {
                console.error('Error:',error.message);
        });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
