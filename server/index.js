const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.SERVER_PORT || 5000;
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();


require('dotenv').config({path: "../.env"});
var token = '';

let db = new sqlite3.Database(__dirname + "/db", (err) => {
        if (err) { return console.error(err.message); }
        console.log('Connected to the in-memory SQlite database.');
});

let Users = [];
db.all("SELECT * FROM Users;",[],(err, row) => {
                if (err) {throw err;}
                else { Users = row; }
});

function randomColor() {
	rand = Math.floor(Math.random()*6);
        if      (rand==0) { return "red";    }
        else if (rand==1) { return "orange"; }
	else if (rand==2) { return "yellow"; }
	else if (rand==3) { return "green";  }
	else if (rand==4) { return "blue";   }
	return "purple";
}

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

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
			let id = parseInt(mes.substring(mes.indexOf('user-id=')+8).split(';')[0]);
			let message = mes.substring(mes.lastIndexOf(":")+1);
			wss.clients.forEach((client) => {
                		if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({user_id:id,mess:message,}));
                		}
			});
			db.all("SELECT * FROM Users WHERE user_id = " + id + ";",[],(err,row) => {
				if (err) { console.log("Error: " + err); }
				else if (row.length == 0) {
					let col = randomColor();
					db.run("INSERT INTO Users (user_id, color) VALUES ("+id+", '" + col + "');");
					Users.push({user_id:id, color:col});
				}
				else { /*logic for message*/ }
			});
			console.log(message);
			if(message == "!red") {
				db.run("UPDATE Users SET color = 'red' WHERE user_id = " + id + ";");
				for (let i of Users) {
					if ( i.user_id==id ) {
						i.color = "red";
					}
				}
			}
			else if(message == "!orange") {
                                db.run("UPDATE Users SET color = 'orange' WHERE user_id = " + id + ";");
                        	for (let i of Users) {
                                        if ( i.user_id==id ) {
                                                i.color = "orange";
                                        }
                                }
			}
			else if(message == "!yellow") {
                                db.run("UPDATE Users SET color = 'yellow' WHERE user_id = " + id + ";");
                        	for (let i of Users) {
                                        if ( i.user_id==id ) {
                                                i.color = "yellow";
                                        }
                                }
			}
			else if(message == "!green") {
                                db.run("UPDATE Users SET color = 'green' WHERE user_id = " + id + ";");
                        	for (let i of Users) {
                                        if ( i.user_id==id ) {
                                                i.color = "green";
                                        }
                                }
			}
			else if(message == "!blue") {
                                db.run("UPDATE Users SET color = 'blue' WHERE user_id = " + id + ";");
                        	for (let i of Users) {
                                        if ( i.user_id==id ) {
                                                i.color = "blue";
                                        }
                                }
			}
			else if(message == "!purple") {
                                db.run("UPDATE Users SET color = 'purple' WHERE user_id = " + id + ";");
                        	for (let i of Users) {
                                        if ( i.user_id==id ) {
                                                i.color = "purple";
                                        }
                                }
			}

		}
	});
});

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
	.then((data) => {
		let i = 0;
		if (data.data != undefined) {
		while( i < data.data.length ) {
			let exists = false;
			for ( let peep of Users ) {
				if ( data.data[i].user_id == peep.user_id ) {
					data.data[i].color = peep.color;
					exists = true;
				}
			}
			if ( !exists ) {
				let col = randomColor();
				Users.push({user_id:data.data[i].user_id,color:col});
				data.data[i].color = col;
				db.run("INSERT INTO users (user_id, color) VALUES ("+data.data[i].user_id+", '" + col + "');");
			}
			i++;
		}}
		res.json(data)
	})
        .catch((error) => {
                console.error('Error:',error.message);
        });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
