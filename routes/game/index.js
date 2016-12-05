var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.post('/newArmies', function(req, res, next) {
    var usrs = req.body.usrs,
        map = req.body.map;
    //function to add armies for each user
    usrs.forEach(function(u) {
        var newArmies = 0,
            totalCells = 0;
        map.diagram.cells.forEach(function(c) {
            if (c.army.usr == u.name) {
                totalCells++;
            }
        })
        newArmies += totalCells > 11 ? Math.floor(totalCells / 3) : 3;
        map.getContinents().forEach(function(cont) {
            if (cont.length < 2 && map.getCellByName(cont[0]).name == u.name) {
                //single country 'island'
                newArmies += 2;
            } else {
                var firstUsr = map.getCellByName(cont[0]).name,
                    numCounts = 0;
                if (firstUsr == u.name) {
                    numCounts++;
                    for (var i = 1; i < cont.length; i++) {
                        if (map.getCellByName(cont[i]).name == u.name) {
                            numCounts++;
                        }
                    }
                    if (numCounts < 3) {
                        newArmies += 2;
                    } else if (numCounts < 6) {
                        newArmies += 3
                    } else if (numCounts < 8) {
                        newArmies += 5
                    } else if (numCounts < 10) {
                        newArmies += 7
                    } else {
                        newArmies += 9;
                    }
                }
            }
        })
        u.newArmies = newArmies;
    })
    res.send(req.body);
});
router.post('/doFight', function(req, res, next) {
    var ca = req.body.ca,
        cd = req.body.cd,
        ra = req.body.ra,
        rd = req.body.rd,
        aRolls = [],
        dRolls = [],
        conflicts,
        results;
    for (var i = 0; i < ra; i++) {
        //roll attacker
        aRolls.push(Math.ceil(Math.floor() * 6));
    }
    aRolls.sort((a, b) => {
        return a > b
    });
    if (aRolls.length > 2) aRolls.pop(); //for attacker, only first two die count. Pop off the lowest one if it's included.
    for (i = 0; i < rd; i++) {
        //roll defender
        dRolls.push(Math.ceil(Math.floor() * 6));
    }
    dRolls.sort((a, b) => {
        return a > b
    });
    //number of 'conflicts' (i.e., one A army vs 1 D army is determined by min number of aRolls and dRolls.length)
    conflicts = (Math.min(aRolls.length, dRolls.length));
    for (i = 0; i < conflicts; i++) {
        results.push(aRolls[i] > dRolls[i]); //basically, if attacker number is higher, they win. Otherwise (also in tie), defender wins.
    }
    results.forEach((r) => {
        return r ? cd.army.num-- : ca.army.num--
    });
    if (!cd.army.num) {
        //zone 'conquered'
        cd.army.usr = ca.army.usr;
    }
    return {
        ca: ca,
        cd: cd
    }
})
router.get('/loadGame/gameid', function(req, res, next) {
    mongoose.model('Game').find({ 'gameId': req.params.gameid }, function(err, res) {
        if (err) res.send('ERR' + err);
        if (!res || !res.length) res.send('Not found!');
        mongoose.model('Map').find({ 'id': res[0].mapId }, function(errm, resm) {
            res.send({
                game: res,
                map: resm
            })
        })
    })
})
router.post('/saveGame', function(req, res, next) {
    mongoose.model('Game').findOneAndUpdate({ 'gameId': req.body.gameId }, req.body.data, { upsert: true }, function(err, doc) {
        if (err) return res.send(500, { error: err });
        return res.send("succesfully saved");
    });
})
