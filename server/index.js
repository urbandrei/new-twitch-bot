const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.SERVER_PORT || 5000;
require('dotenv').config({path: "../.env"});
var token = '';

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
