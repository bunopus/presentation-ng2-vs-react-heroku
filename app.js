const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const morgan = require('morgan');
const app = express();
const MongoClient = require('mongodb').MongoClient;

const dbUrl = process.env.MONGO_URL;

let db;
const USER_COOKIE_NAME = 'ng2-poll-cookie';

app.use(bodyParser.json());
app.use(cookieParser());

let logger = morgan(function(tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        req.cookies[USER_COOKIE_NAME] || 'unknown', // TODO use chalk
        req.body.vote || 'WRONG_VOTE',
        tokens['response-time'](req, res), 'ms',
    ].join(' ');
});
app.use(logger);


app.post('/vote', (req, res) => {
    let fingerprint = req.headers['fingerprint'];
    if(!fingerprint) {
        res.sendStatus(400);
        return;
    }

    let cookieUserId = req.cookies[USER_COOKIE_NAME];
    let user = cookieUserId || fingerprint;

    let query = {};
    if(cookieUserId) {
        query = {user: cookieUserId};
    }
    let data = {
        user: user,
        vote: req.body.vote,
    };

    db.collection('votes').findOneAndUpdate(query, data, {upsert: true})
        .then((result) => {
            if(result.lastErrorObject.upserted) {
                res.cookie(USER_COOKIE_NAME, fingerprint, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    secure: false,
                });
            }
            res.sendStatus(200);
    });
});

MongoClient.connect(dbUrl, (err, database) => {
    if (err) {
        return console.log(err);
    }
    db = database;
    app.listen(3000, function() {
        console.log('Example app listening on port 3000!');
    });
});

// TODO handle close

