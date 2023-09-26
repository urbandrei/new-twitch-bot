const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(__dirname + "/db", (err) => {
        if (err) { return console.error(err.message); }
        console.log('Connected to the in-memory SQlite database.');
});

db.run("CREATE TABLE Users (color VARCHAR(255), user_id INT);");
db.run("CREATE TABLE Twitch_Tokens (token VARCHAR(255), refresh VARCHAR(255));");
db.run("INSERT INTO Twitch_Tokens (token, refresh) VALUES ('', '')");
