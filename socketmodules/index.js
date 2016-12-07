var mongoose = require('mongoose');
var newArmies = function(usrs, map) {
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
}
var doFight = function(ca,cd,ra,rd){
	//take attack cell (ca), defend cell (cd), # rolls attacker (ra), and # rolls defender (rd)
	var aRolls = [],
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
    if (!cd.num) {
        //zone 'conquered'
        cd.user = ca.user;
        cd.num+=ra;
        ca.num-=ra;
    }
    return {
        ca: ca,
        cd: cd
    }
}
var getAllGames = function(){
    return mongoose.model('Game').find({},function(err,docs){
        return docs;
    })
}

module.exports = {
	fight:doFight,
	newArmies:newArmies,
    getAllGames:getAllGames
};
