const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.SERVER_PORT || 5000;
const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();
require('dotenv').config({path: "../.env"});
var token = '';
const messages = {all:[]};

client.on('connectFailed', function(error) {
	console.log('Connect error: ' + error.toString());
});

client.on('connect', function(connection) {
	console.log('WebSocket Client Connected');
	connection.sendUTF('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
	connection.sendUTF(`PASS oauth:`+token); 
	connection.sendUTF(`NICK urbandrei`);
	connection.sendUTF('JOIN #urbandrei');

	connection.on('error', function(error) {
		console.log("Connection Error: " + error.toString());
	});

	connection.on('close', function() {
		console.log('Connection Closed');
		console.log(`close description: ${connection.closeDescription}`);
		console.log(`close reason code: ${connection.closeReasonCode}`);

		clearInterval(intervalObj);
	});

	connection.on('message', function(ircMessage) {
		if (ircMessage.type === 'utf8') {
			let rawIrcMessage = ircMessage.utf8Data.trimEnd();
			console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);
			if (rawIrcMessage.includes("PRIVMSG")) {
				let id = rawIrcMessage.substring(rawIrcMessage.indexOf('user-id=')+8).split(';')[0];;
				
				let message = rawIrcMessage.substring(rawIrcMessage.lastIndexOf(":")+1);
				let i = 0;
				while ( i < messages.all.length ) {
					if(messages.all[i].user_id == id) {
						messages.all.splice(i);
					}
					i++;
				}
				messages.all.push({user_id:id, text:message});
			}
		}
	});
});

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
	.then((data) => {client.connect('ws://irc-ws.chat.twitch.tv:80')})
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
        .then((data) => res.json({users:data,mess:messages}))
        .catch((error) => {
                console.error('Error:',error.message);
        });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
