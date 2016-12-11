var socket = io(),
    socketRoom = null;
app.controller('conkrcon', function($scope, $http, fightFact, mapFact, miscFact, $sce) {
    //before anything, check to see if we're logged in!
    miscFact.chkLoggedStatus().then(function(r) {
        console.log('DATA', r.data);
        if (!r.data.result) window.location.assign('./login');
        $scope.user = r.data.name;
        miscFact.checkInGame(r.data.name).then(function(m) {
            console.log('PLAYER IS IN GAME:', m)
            if (m.data.game) {
                //load map this player's in.
                $scope.reloadGame(m.data.game);
                $scope.canJoin = false; //player cannot join a game while they're in one
            }
        })
    });
    $scope.win = {
        w: $(window).width() * 0.95,
        h: $(window).height() * 0.95
    };
    $scope.reloadGame = function(g) {
        //first, rebuild player-avatar object
        $scope.currGamePlayers = {};
        g.players.forEach((p, i) => {
            $scope.currGamePlayers[p] = g.avas[i];
        });
        //next, set correct game id
        $scope.gameId = g.gameId;
        console.log('GAME', g)
            //finally, map stuff!
        mapFact.loadOneMap(g.mapId).then(function(m) {
            console.log('result of attempt to get 1 map', m)
            $scope.pickMap(m.data.mapData, g.mapId, true);
            $scope.gameReady = true;
        })

    }
    $scope.logout = function() {
        miscFact.logout().then(function() {
            window.location.assign('./login');
        });
    };
    window.onkeyup = function(e) {
        if (e.which == 13 && $scope.showChat) {
            $('#msgInp').focus();
        } else if (e.which == 191) {
            $scope.showChat = true;
            $scope.$digest();
            $('#msgInp').focus();
        }
    };
    $scope.gameMenu = true;
    $scope.currGamePlayers = {};
    $scope.gameIsReady = true;
    $scope.gameSettingsPanel = 0;
    $scope.newNew = true; //for new game creation, create a completely new map? 
    $scope.numCountries = 20;
    $scope.map = null;
    $scope.gameId = null;
    $scope.canJoin = true;
    $scope.potentialMaps = [];
    $scope.loadedMapImg = null;
    $scope.user = null;
    $scope.newMap = function() {
        var smootz = 101 - $scope.smoothing,
            numZones = Math.round($scope.numCountries / 0.3);
        $scope.map = mapFact.GetVoronoi($scope.win.h, $scope.win.w, numZones, smootz);
        $scope.map.init();
        $scope.gameMenu = false;
        sandalchest.confirm("Map okay?", function(r) {
            if (r) {
                $scope.map.save().then(function(sr) {
                    //got id back from mapsave. Put player in this game.
                    sandalchest.confirm("Do you want to start a new game with this map (" + sr.data.id + ")?", function(play) {
                        if (play) {
                            //use sr.id to make a new game.
                            fightFact.newGame(sr.data.id, $scope.user).then(function(g) {
                                console.log('Done! Game made!');
                                socket.emit('getGames', { x: true })
                            });
                        }
                    });
                });
            } else {
                //user doesnt like this map(D:). reset
                $scope.map = null;
                $scope.gameMenu = true;
                $scope.$digest();
            }
        });
    };
    socket.emit('getGames', { x: true })
    $scope.loadMaps = function() {
        //load all OLD maps for a NEW game!
        mapFact.loadMaps().then(function(r) {
            console.log('MAPS', r);
            $scope.potentialMaps = r.data;
        });
    };
    socket.on('allGames', function(g) {
        console.log('FROM ALL GAMES', g);
        $scope.allGames = g;
        $scope.$digest();
    });
    $scope.joinGame = function(g) {
        fightFact.joinGame(g, $scope.user).then(function(r) {
            console.log('JOINED GAME:', r);
            socket.emit('getGames', { x: true })
        });
    };
    $scope.pickMap = function(m, n, old) {
        //load an OLD map for a NEW game
        //map is a new map created just now
        //OR, if 'old' is true, reload an old map and use for old game
        console.log('pikmap data', m, n, old)
        $scope.map = mapFact.GetVoronoi(m.bbox.yb, m.bbox.xr, m.countryNames.length, 20);
        for (var p in m) {
            $scope.map[p] = m[p];
        }
        $scope.map.initLoad(m.img);
        $scope.gameMenu = false;
        if (!old) {
            fightFact.newGame(n, $scope.user).then((x) => {
                socket.emit('getGames', { g: true });
            });
        }
        socket.emit('putInRoom',{id:$scope.gameId})
    };
    socket.on('updateArmies', function(d) {
        console.log('UPDATE ARMIES',d)
        d.players.forEach((p, i) => {
            $scope.currGamePlayers[p] = d.avas[i];
        })
        $scope.armyPieces = fightFact.placeArmies($scope.map, d.armies, $scope.currGamePlayers);
        $scope.$digest();
    })
    socket.on('gameReady', function(d) {
        $scope.gameIsReady = true;
        socket.emit('getGamePieces',d)
        console.log('AT GAMEREADY, D IS', d);
    })
    $scope.toggleNewMode = function(n) {
        $scope.newNew = n > 0;
        if (!$scope.newNew) {
            $scope.loadMaps();
        }
    };
    $scope.startGame = function(id) {
        sandalchest.confirm(`Are you sure you wanna start game ${id}? Starting a game is not reversable, and prevents any more players from joining.`, function(r) {
            if (r) {
                fightFact.startGame(id).then(function(r) {
                    socket.emit('gameStarted', r)
                });
            }
        });
    };
    socket.on('putInGame', (c) => {
        console.log('PUT IN GAME', c)
        if (c.data.players.indexOf($scope.user) > -1) {
            socket.emit('putInRoom', c.data)
        }
    })
    $scope.avgCounInfo = function() {
        sandalchest.alert('Because of how the map is generated, the actual number of countries may or may not be exactly the number here.');
    };
    $scope.smoothInfo = function() {
        sandalchest.alert('Without smoothing, the shapes generated by the map algorithm (a <a href="https://en.wikipedia.org/wiki/Voronoi_diagram" target="_blank">Voronoi Diagram</a>) are very random. Smoothing \'pushes\' the shapes towards being equal size.');
    };
    $scope.doAttack = function(s,d,ra){
        var rd = null,
        dname = $scope.map.diagram.cells[d].name;
        for (var i=0;i<$scope.armyPieces.length;i++){
            if($scope.armyPieces[i].country==dname){
                //defender can roll with a max of two doodz
                rd = $scope.armyPieces[i].num<3?$scope.armyPieces[i].num:2;
                break;
            }
        }
        if (rd>ra) ra=rd; //defender cannot defend with more armies than attacked attacks with
        if(mapFact.isNeighbor($scope.map.diagram.cells,s,d)){
            fightFact.doFight($scope.user,$scope.map.diagram.cells[s],$scope.diagram.cells[d],ra,rd)
        }
    }
});
