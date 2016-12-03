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
