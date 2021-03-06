const session = require('client-sessions')
newArmies = function(usrs, map) {
    //DO WE STILL NEED THIS (see 'addArmies' below)
    //function to add armies for each user
    usrs.forEach(function(u) {
        let newArmies = 0,
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
                const firstUsr = map.getCellByName(cont[0]).name,
                    numCounts = 0;
                if (firstUsr == u.name) {
                    numCounts++;
                    for (let i = 1; i < cont.length; i++) {
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
    let newArmies = 0,
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
            let numCounts = 0,
                usrOwns = true;
            for (let i = 1; i < c.length; i++) {
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
    let aRolls = [],
        dRolls = [],
        conflicts=null,
        results = [],
        status = false; //final status (true=conkr'd)
    for (let i = 0; i < ra; i++) {
        //roll attacker
        aRolls.push(Math.ceil(Math.random() * 6));
    }
    aRolls.sort((a, b) => {
        return b - a;
    });
    if (aRolls.length > 2) aRolls.pop(); //for attacker, only first two die count. Pop off the lowest one if it's included.
    for (i = 0; i < rd; i++) {
        //roll defender
        dRolls.push(Math.ceil(Math.random() * 6));
    }
    dRolls.sort((a, b) => {
        return b - a;
    });
    //number of 'conflicts' (i.e., one A army vs 1 D army is determined by min number of aRolls and dRolls.length)
    conflicts = (Math.min(aRolls.length, dRolls.length));
    for (i = 0; i < conflicts; i++) {
        let attackWin = aRolls[i] > dRolls[i]; //true: offensive army wins. False: defensive army wins (or tie, in which case defender wins).
        //note that for attack modifiers, we ONLY look at the defending cell.
        if (cd.terr == 'plains' || cd.terr == 'urban' && Math.random() < .15) {
            //attack bonus!
            attackWin = true;
        } else if (cd.terr == 'mountain' || cd.terr == 'swamp' && Math.random() < .12) {
            //def bonus!
            attackWin = false;
        }
        results.push(attackWin); //basically, if attacker number is higher, they win. Otherwise (also in tie), defender wins.
    }
    console.log('RESULTS', results, aRolls, dRolls)
    results.forEach((r) => {
        r ? cd.num-- : ca.num--;
    });
    //zone 'conquered'
    status = cd.num==0;
    if (status){
        //if zone is conquered, move number of attacking armies in to 'occupy'.
        numTransf = ra - results.filter(function(r){
            return r;
        }).length;
        ca.num-=numTransf;
        cd.num=numTransf;
    }
    console.log(`End result: ${ca.country} ${ca.num} vs ${cd.country} ${cd.num}`)
    return {
        ca: ca,
        cd: cd,
        status: status
    }
}, getInitArmies = function(c, p) {
    const arr = [];
    c.forEach((n) => {
        console.log('N IS', n, 'END N')
        arr.push({
            user: p[Math.floor(Math.random() * p.length)],
            country: n.name,
            num: 1,
            terr: n.terr
        });
    });
    console.log('Armies:', arr);
    return arr;
}, getAuthUsr = function(settings, rawDough) {
    //get the authorized username from the client sessions cookie. This allows us to authenticate that the person doing an attack is, in fact, the person doing the attack.
    const ingredients = session.util.decode(settings, rawDough).content;
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
