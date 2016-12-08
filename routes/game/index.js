var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions'),
    sockmod = require('../../socketmodules');
module.exports = router;
router.post('/new/', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Map').find({ id: req.body.id }, function(err, tingz) {
        if (err) return next(err);
        if (!tingz.length) return "Map not found err!";
        var newId = Math.floor(Math.random() * 99999999).toString(32);
        var newGame = {
            mapId: req.body.id,
            armies: [],
            players: [req.body.player],
            gameId: newId,
            inPlay: false,
            turn: 0,
            creator: req.body.player
        }
        mongoose.model('Game').create(newGame)
    })
})
router.post('/join', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Game').findOne({ 'gameId': req.body.gameId }, function(err, doc) {
        if (err) return res.send(500, { error: err });
        if (doc.inPlay) {
            //this SHOULDNT ever be triggered, since only the open games will be joinable, but just in case!
            res.send('inprog');
            return;
        }
        doc.players.push(req.body.player);
        doc.save();
        mongoose.model('Map').findOne({ id: doc.mapId }, function(err, mdoc) {
            if (err) return next(err);
            res.send({ map: mdoc, game: doc });
        })
    })
})
router.post('/saveGame', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Game').findOneAndUpdate({ 'gameId': req.body.gameId }, req.body.data, { upsert: true }, function(err, doc) {
        if (err) return res.send(500, { error: err });
        return res.send("succesfully saved");
    });
})
router.get('/startGame/:id', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    // basically, this sets a game's 'inPlay' property to true. While a game is in play, players cannot join it (see '/join'). Games cannot be reset to inPlay==false after they're started.
    mongoose.model('Game').findOne({ 'gameId': req.params.id }, function(err, doc) {
        if (err||!doc) {
            res.send('errGame');
        }
        doc.inPlay = true;
        doc.turn=0;//should already be set, but just in case!
        mongoose.model('Map').findOne({ 'id': doc.mapId }, function(err, mdoc) {
            if (err || !mdoc){
                res.send('errMap');
            }
            var couns = mdoc.mapData.countryNames;
            var players = doc.players;
            doc.armies = sockmod.getInitArmies(couns,players);
            doc.save(); 
            res.send(doc); 
        })
    })

})
router.get('/getGames', function(req, res, next) {
    if (!req.session.user) {
        res.send('errLog');
        return;
    }
    mongoose.model('Game').find({}, function(err, docs) {
        socket.emit('allGames', r);
        res.send(true);
    })
})
