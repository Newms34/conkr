app.factory('fightFact', function($rootScope, $http) {
    // note: we are NOT writing an AI player for Conkr, as AI for playing Risk™ is notoriously difficult to write
    return {
        getMaxArmy: function(c, m) {
            var attackPenalty = m ? 1 : 0;
            // note that this will at min be > 0.
            return Math.floor(c.army.num - attackPenalty);
        },
        doFight: function(ca, cd, ra, rd) {
            $http.post('/game/doFight', {
                ca: ca,
                cd: cd,
                ra: ra,
                rd: rd
            }).then(function(res) {
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
        },
        saveGame: function(id,map) {
            if (!id) {
                bootbox.alert('Map save error: no map id!', function() {
                    return false;
                })
            }else{
                var gameData = {
                    gameId:id,
                    armies:[],
                    mapId:map.id
                }
                map.diagram.cells.forEach((c,i)=>{
                    if(c.name){
                        gameData.armies.push({
                            user:c.army.usr,
                            country:c.name,
                            num:c.army.num
                        })
                    }
                });
                return $http.post('/game/saveGame',gameData)
            }
        }
    };
});
