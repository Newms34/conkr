var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.post('/newMap', function(req, res, next) {
    //create a new game!
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    var mapId = Math.floor(Math.random() * 99999999999).toString(32),
        map = req.body;
    console.log('SESSION USER', req.session.user.name)
    mongoose.model('Map').create({ id: mapId, mapData: map, creator: req.session.user.name }, function(err, data) {
        console.log("KREEAYTRZ", data.creator)
        if (err) {
            res.send(err)
        } else {
            res.send({ id: mapId });
        }
    });
})
router.get('/loadMaps', function(req, res, next) {
    //load all maps so user can pick an old map
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Map').find({}, function(err, data) {
        if (err) {
            res.send(err)
        } else if (!data.length) {
            res.send([])
        } else {
            res.send(data);
        }
    });
})

router.get('/loadMap/:id', function(req, res, next) {
    //load one map. notice MAP, not MAPS
    console.log('attempted to get map', req.params.id)
    if (!req.session.user) {
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('Map').findOne({ 'id': req.params.id }, function(err, doc) {
        console.log('RESULT IS', doc)
        if (err) {
            res.send(err);
        } else {
            res.send(doc);
        }
    });
})

router.delete('/del/:id', function(req, res, next) {
    if (!req.session.user) {
        res.send('logErr');
        return;
    }
    mongoose.model.findOne({ 'id': req.params.id }, function(err, doc) {
        if (err) res.send(err);
        if (doc.hasGames) {
            res.send('usedMap')
        }
        mongoose.model('Map').remove({ 'id': req.params.id }, function(err) {
            if (err) {
                res.send(err);
            } else {
                res.send('deleted!');
            }
        });
    })
})
