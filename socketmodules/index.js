var mongoose = require('mongoose'),
    cookie = require('cookie'),
    session = require('client-sessions')
newArmies = function(usrs, map) {
    //DO WE STILL NEED THIS (see 'addArmies' below)
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
}, addArmies = function(conts, armies, usr) {
    //function to add armies for each user
    var newArmies = 0,
        totalCells = 0,
        contBonus = 0,
        ownCountries = [];
    armies.forEach((a) => {
        if (a.user == usr) {
            totalCells++;
            ownCountries.push(a.country);
        }
    })
    console.log('MAP CONTS', conts)
    newArmies += Math.floor(totalCells / 3);
    if (newArmies < 3) newArmies = 3;
    conts.forEach((c) => {
        if (c.length < 2 && ownCountries.indexOf(c[0]) > -1) {
            newArmies += 2;
        } else if (ownCountries.indexOf(c[0]) > -1) {
            var numCounts = 0,
                usrOwns = true;
            for (var i = 1; i < c.length; i++) {
                if (ownCountries.indexOf(c[i]) > -1) {
                    numCounts
                } else {
                    usrOwns = false;
                    break;
                }
            }
            if (usrOwns) {
                //gone thru all the countries on this continent, and usr owns the WHOLE thing.
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
    });
    return newArmies;
}, doFight = function(ca, cd, ra, rd) {
    console.log(ca.country, ca.num, 'vs', cd.country, cd.num)
        //take attack cell (ca), defend cell (cd), # rolls attacker (ra), and # rolls defender (rd)
    var aRolls = [],
        dRolls = [],
        conflicts,
        results = [],
        status = false; //final status (true=conkr'd)
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
        r ? cd.num-- : ca.num--;
    });
        //zone 'conquered'
    status = !cd.num;
    console.log(`End result: ${ca.country} ${ca.num} vs ${cd.country} ${cd.num}`)
    return {
        ca: ca,
        cd: cd,
        status: status
    }
}, getInitArmies = function(c, p) {
    var arr = [];
    c.forEach((n) => {
        arr.push({
            user: p[Math.floor(Math.random() * p.length)],
            country: n,
            num: 1
        });
    });
    return arr;
}, getAuthUsr = function(settings, rawDough) {
    //get the authorized username from the client sessions cookie. This allows us to authenticate that the person doing an attack is, in fact, the person doing the attack.
    var ingredients = session.util.decode(settings, rawDough).content;
    return ingredients && ingredients.user && ingredients.user.name ? ingredients.user.name : false;
};

module.exports = {
    fight: doFight,
    newArmies: newArmies,
    getInitArmies: getInitArmies,
    getAuthUsr: getAuthUsr,
    doFight: doFight,
    addArmies: addArmies
};
