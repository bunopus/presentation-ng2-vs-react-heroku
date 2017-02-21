const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;

const dbUrl = process.env.MONGO_URL;


app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
    res.send('Hello World!');
});

MongoClient.connect(dbUrl, (err, database) => {
    if (err) {
        return console.log(err);
    }
    console.log(database);
    app.listen(3000, function() {
        console.log('Example app listening on port 3000!');
    });
});


