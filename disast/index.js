const doDisast = function(c) {
    //c: army cells
    //temporary short circuit: enable to disable disaster 'factory'
    // return {cells:c,dis:[]}
    console.log('INCOMING TO DISASTER FNS:',c)
    const numDisasts = Math.floor(Math.random() * c.length * .25), //per turn, disasters can happen to up to a quarter (25%) of the occupiable continents
        disasts = [],
        disastNumsDone = [],
        getDisast = function(cell) {
            numDead = 0;
            console.log('INCOMING CELL:', cell, 'TYPE', cell.terr)
            if (cell.terr == 'plains') {
                if (Math.random() > 0.5) {
                    console.log('plains, tornado')
                    numDead = cell.num > 1 ? Math.floor(Math.random() * 2) + 1 : 1;
                    cell.num -= numDead;
                    disasts.push(`A tornado touched down in ${cell.country}, killing ${numDead} armies! ${cell.country}'s armies are scattered, preventing attacks this turn`);
                    cell.debuff = 'noAttack';
                    return cell;
                } else {
                    console.log('plains, flood')
                    numDead = cell.num > 2 ? Math.floor(Math.random() * 2) + 2 : 1;
                    cell.num -= numDead;
                    var converted = Math.random() > .8;
                    disasts.push(`Rising waters cause a horrible flood in ${cell.country}, killing ${numDead} armies! ${cell.country}'s armies are scattered, preventing attacks this turn.${converted?' Additionally, the land has been converted to a swamp.':''}`);
                    if (converted) {
                        cell.terr = 'swamp'
                    }
                    return cell;
                }
            } else if (cell.terr == 'tundra') {
                console.log('tundra, tornado')
                numDead = cell.num > 1 ? Math.floor(Math.random() * 2) + 1 : 1;
                cell.num -= numDead;
                disasts.push(`A tornado touched down in ${cell.country}, killing ${numDead} armies! ${cell.country}'s armies are scattered, preventing attacks this turn`);
                cell.debuff = 'noAttack';
                return cell;
            } else if (cell.terr == 'hills') {
                console.log('hills, flood')
                numDead = cell.num > 2 ? Math.floor(Math.random() * 2) + 2 : 1;
                cell.num -= numDead;
                var converted = Math.random() > .8;
                disasts.push(`Rising waters cause a horrible flood in ${cell.country}, killing ${numDead} armies! ${cell.country}'s armies are scattered, preventing attacks this turn.${converted?' Additionally, the land has been converted to a swamp.':''}`);
                if (converted) {
                    cell.terr = 'swamp'
                }
                return cell;
            } else if (cell.terr == 'city' || cell.terr == 'frozen city') {
                console.log('city or frozen city, epidemic')
                numDead = cell.num > 2 ? Math.floor(Math.random() * 2) + 2 : 1;
                cell.num -= numDead;
                disasts.push(`A horrible epidemic has struck the people of ${cell.country}! It kills off ${numDead} armies and demoralizes the citizens of ${cell.country}, preventing recruiting.`);
                cell.debuff = 'noRecruit';
                return cell;
            } else if (cell.terr == 'frozen forest' || cell.terr == 'boreal forest') {
                console.log('frozen forest, forest fire')
                numDead = cell.num > 2 ? Math.floor(Math.random() * 2) + 2 : 1;
                cell.num -= numDead;
                var converted = Math.random() > .8;
                if (converted) {
                    cell.terr = cell.terr == 'tundra';
                }
                disasts.push(`A fierce, raging forest fire breaks out in ${cell.country}! It kills off ${numDead} armies.${converted?' The fire was so fierce that the land has been converted to a '+cell.terr+'!':''}`);
                return cell;
            } else if (cell.terr == 'forest') {
                if (Math.random() > 0.5) {
                    console.log('forest, forest fire')

                    numDead = cell.num > 2 ? Math.floor(Math.random() * 2) + 2 : 1;
                    cell.num -= numDead;
                    var converted = Math.random() > .8;
                    if (converted) {
                        cell.terr = 'plains';
                    }
                    disasts.push(`A fierce, raging forest fire breaks out in ${cell.country}! It kills off ${numDead} armies.${converted?' The fire was so fierce that the land has been converted to a '+cell.terr+'!':''}`);
                    return cell;
                } else {
                    console.log('forest, flood')
                    numDead = cell.num > 2 ? Math.floor(Math.random() * 2) + 2 : 1;
                    cell.num -= numDead;
                    var converted = Math.random() > .8;
                    if (converted) {
                        cell.terr = 'swamp';
                    }
                    disasts.push(`Rising waters cause a horrible flood in ${cell.country}, killing ${numDead} armies! ${cell.country}'s armies are scattered, preventing attacks this turn.${converted?' Additionally, the land has been converted to a swamp.':''}`);
                    return cell;
                }
            } else if (cell.terr == 'mountain') {
                console.log('mountain, avalanche')
                numDead = Math.floor(cell.num * .75);
                cell.num -= numDead;
                disasts.push(`An avalange has devastated the armies of ${cell.country}! It kills off ${numDead} armies.`);
                return cell;
            } else if (cell.terr == 'swamp' || cell.terr == 'frozen swamp') {
                console.log('swamp, swampgas')
                numDead = Math.floor(cell.num * .75);
                cell.num -= numDead;
                disasts.push(`Deadly swamp gas has errupted in ${cell.country}! It kills off ${numDead} armies.`);
                return cell;
            }
        };
    for (let i = 0; i < numDisasts; i++) {
        //find a cell number that has not yet been given a disaster
        let nd = Math.floor(Math.random() * c.length);
        while (disastNumsDone.indexOf(nd) > -1) {
            nd = Math.floor(Math.random() * c.length);
        }
        console.log('DISASTER CELL NUM',nd)
        if (Math.random() < 0.5 && c[nd].num > 1) {
            //if random chance to spawn disaster, and cell number greater than 1. 
            disastNumsDone.push(nd);
            console.log('getting disaster for cell', i, 'with terrain type', c[nd].terr)
            c[nd] = getDisast(c[nd]); //modify cell number according disaster
        }

    }
    console.log('RESULTS');
    console.log(disasts);
    return {
        cells: c,
        dis: disasts
    }
}

module.exports = doDisast;
