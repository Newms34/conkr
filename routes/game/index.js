var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.post('/new/', function(req, res, next) {
    mongoose.model('Map').find({id:req.body.id},function(err,tingz){
        if(err) return next(err);
        if (!tingz.length) return "Map not found err!";
        var newId = Math.floor(Math.random()*99999999).toString(32);
        var newGame = {
            mapId:req.body.id,
            armies:[],
            players:[req.body.player],
            gameId:newId,
            inPlay:false,
            turn:0,
            creator:req.body.player
        }
        mongoose.model('Game').create(newGame)
    })
})
router.post('/join',function(req,res,next){
    mongoose.model('Game').findOne({'gameId':req.body.gameId},function(err,doc){
        if (err) return res.send(500,{error:err});
        if(doc.inPlay){
            //this SHOULDNT ever be triggered, since only the open games will be joinable, but just in case!
            res.send('Game already in progress!');
            return;
        }
        doc.players.push(req.body.player);
        doc.save();
        mongoose.model('Map').findOne({id:doc.mapId},function(err,mdoc){
            if (err) return next (err); 
            res.send({map:mdoc,game:doc});
        })
    })
})
router.post('/saveGame', function(req, res, next) {
    mongoose.model('Game').findOneAndUpdate({ 'gameId': req.body.gameId }, req.body.data, { upsert: true }, function(err, doc) {
        if (err) return res.send(500, { error: err });
        return res.send("succesfully saved");
    });
})
router.get('/startGame/:id',function(req,res,next){
    // basically, this sets a game's 'inPlay' property to true. While a game is in play, players cannot join it (see '/join'). Games cannot be reset to inPlay==false after they're started.
    mongoose.model('Game').findOne({ 'gameId': req.parms.id },function(err,doc){
        if (err) return res.send(500, { error: err });
        if (!doc) return 'Game not found!';
        doc.inPlay = true;
        res.send('Game started!')
    })
})