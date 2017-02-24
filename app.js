const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const morgan = require('morgan');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

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
        _getCookie(req) || 'unknown', // TODO use chalk
        req.body.vote || 'NONE',
        tokens['response-time'](req, res), 'ms',
    ].join(' ');
});
app.use(logger);

app.use(express.static(__dirname + '/public'));

app.post('/vote', (req, res) => {
    let fingerprint = _getFingerprint(req);
    if(!fingerprint) {
        res.sendStatus(400);
        return;
    }

    let cookieUserId = _getCookie(req);

    let data = {
        fingerprint: fingerprint,
        vote: req.body.vote,
    };

    if(!cookieUserId) {
        insertNewVote(data, res);
    } else {
        updateVote(cookieUserId, data, res);
    }
});

app.get('/vote', (req, res) => {
    let cookieUserId = _getCookie(req);
    if(!cookieUserId) {
        res.sendStatus(401);
        return;
    }
    db.collection('votes').findOne(_getVoteQuery(cookieUserId))
        .then((result) => {
            res.send({vote: result.vote});
        });
});

function _getCookie(req) {
    return req.cookies['ng2-poll-cookie'];
}

function _getFingerprint(req) {
    return req.headers['fingerprint'];
}

function insertNewVote(data, res) {
    db.collection('votes').insertOne(data)
        .then((result) => {
            res.cookie(USER_COOKIE_NAME, JSON.stringify(result.insertedId), {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: false,
            });
            res.sendStatus(200);
        });
}

function updateVote(cookieUserId, data, res) {
    let query = _getVoteQuery(cookieUserId);
    db.collection('votes').updateOne(query, data)
        .then(() => {
            res.sendStatus(200);
        });
}

function _getVoteQuery(cookieUserId) {
    let id = new ObjectID(JSON.parse(cookieUserId));
    return {_id: id};
}

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

