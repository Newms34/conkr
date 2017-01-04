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
        sandalchest.confirm("Confirm Map", "Do you want to accept this map?", function(r) {
            if (r) {
                $scope.map.save().then(function(sr) {
                    // $scope.countryLbls = $scope.map.counLblObjs();
                    sandalchest.confirm("Start Game", "Do you want to start a new game with this map (" + sr.data.id + ")?", function(play) {
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
                //user doesnt like this map(Q_Q). reset
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
            $scope.$digest();
        });
    };
    socket.on('replaceMap', function() {
        //force reload of maps, since one got updated or deleted or something.
        $scope.loadMaps();
    })
    socket.on('allGames', function(g) {
        console.log('FROM ALL GAMES', g);
        $scope.allGames = g;
        $scope.loadMaps();
        $scope.$digest();
    });
    $scope.deleteMap = function(id) {
        sandalchest.confirm('Delete Map', 'Are you sure you want to delete map ' + id + '?', function(n) {
            if (n) {
                mapFact.delMap(id);
            }
        })
    };
    $scope.pickTarg = false;
    var debugMode = false; //allows us to pick our own dudes as targets
    $scope.pickCell = function(ap) {
        if ($scope.srcCell && $scope.map.diagram.cells[$scope.srcCell].country == ap.country && ap.status > 0) {
            ap.status = 0;
            $scope.srcCell = null;
            $scope.targCell = null;
            $scope.pickTarg = false;
            return true;
        } else if (!$scope.pickTarg && ap.usr == $scope.user) {
            $scope.armyPieces.forEach((p) => { p.status = 0 });
            //picking source cell
            $scope.srcCell = $scope.map.getCellNumByName(ap.country);
            ap.status = 1;
            $scope.targCell = null;
            $scope.pickTarg = true;
            return true;
        } else if ($scope.pickTarg == true && (ap.usr != $scope.user || debugMode)) {
            if (!mapFact.isNeighbor($scope.map.diagram.cells, $scope.srcCell, $scope.map.getCellNumByName(ap.country))) {
                sandalchest.alert("Uh Oh!", "Hey! You can't attack " + ap.country + " from " + $scope.map.diagram.cells[$scope.srcCell].country + "!", { speed: 250 })
                return false;
            }
            $scope.targCell = $scope.map.getCellNumByName(ap.country);
            ap.status = 2;
            $scope.pickTarg = false;
        } else if ($scope.pickTarg && ap.usr == $scope.user) {
            sandalchest.alert("Uh Oh!", "Hey! You can't attack yourself at " + ap.country + "!", { speed: 250 })
        }
    };
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
        //(i.e., rejoin player to game)
        console.log('pikmap data', m, n, old)
        $scope.map = mapFact.GetVoronoi(m.bbox.yb, m.bbox.xr, m.countryNames.length, 20);
        for (var p in m) {
            $scope.map[p] = m[p];
        }
        $scope.map.initLoad(m.img);
        // $scope.countryLbls = $scope.map.counLblObjs();
        $scope.gameMenu = false;
        if (!old) {
            fightFact.newGame(n, $scope.user).then((x) => {
                socket.emit('getGames', { g: true });
                sandalchest.alert('Started a new game!')
                socket.emit('putInRoom', { id: x.data })
            });
        } else {
            socket.emit('putInRoom', { id: $scope.gameId })
        }
        $scope.armyPieces = [];
    };
    socket.on('updateArmies', function(d) {
        console.log('UPDATE ARMIES', d)
        d.players.forEach((p, i) => {
            $scope.currGamePlayers[p] = d.avas[i];
        })
        $scope.armyPieces = fightFact.placeArmies($scope.map, d.armies, $scope.currGamePlayers);
        $scope.$digest();
    })
    socket.on('gameReady', function(d) {
        $scope.gameIsReady = true;
        socket.emit('getGamePieces', d)
        console.log('AT GAMEREADY, D IS', d);
    })
    $scope.toggleNewMode = function(n) {
        $scope.newNew = n > 0;
        if (!$scope.newNew) {
            $scope.loadMaps();
        }
    };
    $scope.startGame = function(id) {
        sandalchest.confirm(`Start Game ${id}`, `Are you sure you wanna start game ${id}? Starting a game is not reversable, and prevents any more players from joining.`, function(r) {
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
        sandalchest.alert('Country Number', 'Because of how the map is generated, the actual number of countries may or may not be exactly the number here.');
    };
    $scope.smoothInfo = function() {
        sandalchest.alert('Map Smoothing', 'Without smoothing, the shapes generated by the map algorithm (a <a href="https://en.wikipedia.org/wiki/Voronoi_diagram" target="_blank">Voronoi Diagram</a>) are very random. Smoothing \'pushes\' the shapes towards being equal size.');
    };
    $scope.doAttack = function(s, d, ra) {
        var rd = null,
            dname = $scope.map.diagram.cells[d].name;
        for (var i = 0; i < $scope.armyPieces.length; i++) {
            if ($scope.armyPieces[i].country == dname) {
                //defender can roll with a max of two doodz
                rd = $scope.armyPieces[i].num < 3 ? $scope.armyPieces[i].num : 2;
                break;
            }
        }
        if (rd > ra) ra = rd; //defender cannot defend with more armies than attacker attacks with
        if (mapFact.isNeighbor($scope.map.diagram.cells, s, d)) {
            fightFact.doFight($scope.user, $scope.getAPByName($scope.map.diagram.cells[s].name), $scope.getAPByName($scope.map.diagram.cells[d].name), ra, rd, $scope.gameId)
        }
    }
    $scope.getAPByName = function(name) {
        for (var i = 0; i < $scope.armyPieces.length; i++) {
            if ($scope.armyPieces[i].country == name) {
                return $scope.armyPieces[i];
            }
        }
        return false;
    }
    $scope.startAttack = function() {
        console.log('SOURCE CELL', $scope.map.diagram.cells[$scope.srcCell])
        if ((!$scope.srcCell && $scope.srcCell !== 0) || (!$scope.targCell && $scope.targCell !== 0)) {
            sandalchest.alert('Attack Issue', 'You need both an attacker and a target!')
        } else if ($scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name) && $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num < 2) {
            sandalchest.alert("Not Enough Armies", `You can't attack from ${$scope.map.diagram.cells[$scope.srcCell].name}! Attacking countries need at least two armies: One to attack, and one to stay home!`)
        } else {
            var maxPain = $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num < 5 ? $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num - 1 : 3;
            sandalchest.prompt('Army Strength', `How many armies do you wanna attack with? You can attack with at most ${maxPain} armies.`, function(res) {
                res = parseInt(res);
                if (isNaN(res) || res == 0) {
                    return false;
                }
                console.log($scope.map.diagram.cells[$scope.srcCell].name, 'attacking', $scope.map.diagram.cells[$scope.targCell].name, 'with', res, 'armies.');
                $scope.doAttack($scope.srcCell, $scope.targCell, res);
            })
        }
    };
    socket.on('rcvDoFight', function(res) {
        var defr = $scope.getAPByName(res.cd.country),
            atkr = $scope.getAPByName(res.ca.country),
            replProps = [
                'usr', 'lbl', 'num'
            ];
        if (res.status) {
            //zone 'conkrd', so replace defending user with attacking user
            res.cd.usr = res.ca.usr;
        }
        console.log('from rcvDoFight, we get', defr, atkr);
        replProps.forEach((p) => {
            defr[p] = res.cd[p];
            atkr[p] = res.ca[p];
        })
        $scope.$apply()
    });
    $scope.nextTurn = function() {
        sandalchest.confirm('End Turn', 'Are you sure you want to end your turn?', function(res) {
            console.log(res)
            if (res && res != null) {
                fightFact.nextTurn($scope.map,$scope.gameId, $scope.user);
            }
        })
    }
});
