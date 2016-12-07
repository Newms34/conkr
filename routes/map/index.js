var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.post('/newMap', function(req,res,next) {
    //create a new game!
    var mapId = Math.floor(Math.random() * 99999999999).toString(32),
        map = req.body;
    mongoose.model('Map').create({ id: mapId, mapData: map }, function(err, data) {
        if (err) {
            res.send(err)
        } else {
            res.send({id:mapId});
        }
    });
})
router.get('/loadMaps', function(req,res,next) {
    //load all maps so user can pick an old map
    var mapId = req.params.mapId
    mongoose.model('Map').find({}, function(err, data) {
        if (err) {
            res.send(err)
        } else if(!data.length){
        	res.send([])
        }else {
            res.send(data);
        }
    });
})