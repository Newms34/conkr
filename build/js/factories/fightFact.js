app.factory('fightFact', function($rootScope, $http) {
    // note: we are NOT writing an AI player for Conkr, as AI for playing Risk™ is notoriously difficult to write
    return {
        getMaxArmy: function(c, m) {
            var attackPenalty = m ? 1 : 0;
            // note that this will at min be > 0.
            return Math.floor(c.army.num - attackPenalty);
        },
        doFight: function(ca, cd, ra, rd) {
            //this will only run if the cells are adjacent (via a test in mapFact)
            //ca: attacking cell; cd: defending cell; ra: rolls for attacker (army num - 1  max); rd: rolls for defender (army num)
            // var aRolls = [],
            //     dRolls = [],
            //     conflicts,
            //     results;
            // for (var i = 0; i < ra; i++) {
            //     //roll attacker
            //     aRolls.push(Math.ceil(Math.floor() * 6));
            // }
            // aRolls.sort((a, b) => {
            //     return a > b
            // });
            // if (aRolls.length > 2) aRolls.pop(); //for attacker, only first two die count. Pop off the lowest one if it's included.
            // for (i = 0; i < rd; i++) {
            //     //roll defender
            //     dRolls.push(Math.ceil(Math.floor() * 6));
            // }
            // dRolls.sort((a, b) => {
            //     return a > b
            // });
            // //number of 'conflicts' (i.e., one A army vs 1 D army is determined by min number of aRolls and dRolls.length)
            // conflicts = (Math.min(aRolls.length, dRolls.length));
            // for (i = 0; i < conflicts; i++) {
            //     results.push(aRolls[i] > dRolls[i]); //basically, if attacker number is higher, they win. Otherwise (also in tie), defender wins.
            // }
            // results.forEach((r) => {
            //     return r ? cd.army.num-- : ca.army.num--
            // });
            // if (!cd.army.num) {
            //     //zone 'conquered'
            //     cd.army.usr = ca.army.usr;
            // }
            $http.post('/game/doFight', {
                ca: ca,
                cd: cd,
                ra: ra,
                rd: rd
            }).then(function(res){
                ca = res.data.ca;
                cd = res.data.cd;
            })
        },
        getInitArmies: function(map, usrs) {
            //such creative arg names!
            map.diagram.cells.forEach(function(c) {
                c.army.num = 1;
                c.army.usr = usrs[Math.floor(Math.random() * usrs.length)].name;
            });
        },
        addArmies: function(map, usrs) {
            //function to add armies for each user
            $http.post('/game/newArmies', { map: map, usrs: usrs }).then(function(resp) {
                usrs = resp.data.usrs;
            })
        }
    };
});
