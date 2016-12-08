app.factory('fightFact', function($rootScope, $http) {
    // note: we are NOT writing an AI player for Conkr, as AI for playing Risk™ is notoriously difficult to write
    return {
        getMaxArmy: function(c, m) {
            var attackPenalty = m ? 1 : 0;
            // note that this will at min be > 0.
            return Math.floor(c.army.num - attackPenalty);
        },
        doFight: function(ca, cd, ra, rd) {
            socketRoom.emit('sendDoFight', {
                ca: ca,
                cd: cd,
                ra: ra,
                rd: rd
            });
        },
        newGame: function(n, p) {
            return $http.post('/game/new/', { id: n, player: p }).then(function(p) {
                return p;
            });
        },
        joinGame: function(m, p) {
            //join a not-yet-started game;
            return $http.post('/game/join', { gameId: m, player: p }, function(p) {
                return p;
            });
        },
        addArmies: function(game) {
            //function to add armies for each user
            socketRoom.emit('sendAddArmies', { game: game });
        },
        saveGame: function(id, map) {
            if (!id) {
                sandalchest.alert('Map save error: no map id!', function() {
                    return false;
                });
            } else {
                var gameData = {
                    gameId: id,
                    armies: [],
                    mapId: map.id
                };
                map.diagram.cells.forEach((c, i) => {
                    if (c.name) {
                        gameData.armies.push({
                            user: c.army.usr,
                            country: c.name,
                            num: c.army.num
                        });
                    }
                });
                return $http.post('/game/saveGame', gameData);
            }
        },
        startGame: function(id) {
            //creator of a game sets it to started, meaning no more doodz can join.
            return $http.get('/game/startGame/'+id).then(function(r){
                return r;
            });
        }
    };
});
