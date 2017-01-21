var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions'),
    sockmod = require('../../socketmodules');
module.exports = router;
Array.prototype.shuffle = function() {
    var currentIndex = this.length,
        temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = this[currentIndex];
        this[currentIndex] = this[randomIndex];
        this[randomIndex] = temporaryValue;
    }
    return this;
};
router.post('/new', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Map').findOne({ id: req.body.id }, function(err, tingz) {
        if (err) return next(err);
        if (!tingz) return "Map not found err!";
        var newId = Math.floor(Math.random() * 99999999).toString(32);
        var newGame = {
            mapId: req.body.id,
            armies: [],
            players: [req.body.player],
            gameId: newId,
            inPlay: false,
            turn: 0,
            creator: req.body.player,
            protected: false
        }
        if (req.body.pwd && req.body.pwd != '') {
            //if the user supplies a password, password-protected
            var salt = mongoose.model('Game').generateSalt();
            var pass = mongoose.model('Game').encryptPassword(req.body.pwd, salt)
            newGame.salt = salt;
            newGame.pass = pass;
            newGame.protected = true;
        }
        mongoose.model('Game').create(newGame)
            //finally, we record that the relevant map now has an associated game (and thus cannot be deleted)
        tingz.hasGames = true;
        tingz.save();
        res.send(newId)
    })
});
router.get('/del/:id', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    console.log('Deleting game',req.params.id,'or at least attempt to...')
    mongoose.model('Game').findOne({ gameId: req.params.id }, function(err, game) {
        console.log('Game is',game,'curr usr is',req.session.user.name)
        if (!game || game.creator !== req.session.user.name) {
            res.send('wrongUser')
            return;
        }
        var whichMap = game.mapId;
        mongoose.model('Game').find({gameId:req.params.id}).remove(function(err) {
            console.log('Successfully removed game!')
            if (err) res.send(err);
            mongoose.model('Map').findOne({ id: game.mapId }, function(err, map) {
                mongoose.model('Game').find({}, function(errg, games) {
                    //find this game's map
                    map.hasGames = false;
                    //go thru all games and see if any are still using this map. 
                    games.forEach((gm) => {
                        //look thru all games. If a game exists where the map's the same as this just-deleted game, set hasGames to true.
                        if (gm.mapId == whichMap) map.hasGames = true;
                    })
                    map.save();
                    res.send('done')
                })
            })
        })

    })
});
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
        if (doc.protected && !doc.correctPassword(req.body.pwd)) {
            res.send('gameLogErr')
            return;
        }
        doc.players.push(req.body.player);
        doc.save();
        mongoose.model('Map').findOne({ id: doc.mapId }, function(err, mdoc) {
            if (err) return next(err);
            res.send({ map: mdoc, game: doc });
        })
    })
});
router.post('/saveGame', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Game').findOneAndUpdate({ 'gameId': req.body.gameId }, req.body.data, { upsert: true }, function(err, doc) {
        if (err) return res.send(500, { error: err });
        return res.send("succesfully saved");
    });
});
router.get('/startGame/:id', function(req, res, next) {
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    // basically, this sets a game's 'inPlay' property to true. once a game is in play, players cannot join it (see '/join'). Games cannot be reset to inPlay==false after they're started.
    mongoose.model('Game').findOne({ 'gameId': req.params.id }, function(err, doc) {
        if (err || !doc) {
            res.send('errGame');
        }
        doc.inPlay = true;
        doc.turn = 0; //should already be set, but just in case!
        mongoose.model('Map').findOne({ 'id': doc.mapId }, function(err, mdoc) {
            if (err || !mdoc) {
                res.send('errMap');
            }
            doc.players = doc.players.shuffle()
            var couns = mdoc.mapData.cellCenters;
            var players = doc.players;
            if (!doc.avas) doc.avas = [];
            doc.armies = sockmod.getInitArmies(couns, players);
            var allAnims = [128045, 128046, 128047, 128048, 128049, 128050, 128052, 128053, 128054, 128055, 128056, 128057, 128058, 128060, 128023, 128040, 128127, 128125, 128123, 127877];
            //pick an avatar (animal) for each player
            players.forEach((p) => {
                var pik = Math.floor(Math.random() * allAnims.length);
                doc.avas.push(allAnims[pik]);
                allAnims.slice(pik, 1);
            })
            doc.save();
            res.send(doc);
        })
    })
});
router.get('/getGames', function(req, res, next) {
    if (!req.session.user) {
        res.send('errLog');
        return;
    }
    mongoose.model('Game').find({}, function(err, docs) {
        socket.emit('allGames', r);
        res.send(true);
    })
});
