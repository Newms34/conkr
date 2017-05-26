var socket = io(),
    socketRoom = null;
app.controller('conkrcon', function($scope, $http, fightFact, mapFact, miscFact, $sce, disastFact) {
    $scope.isDead = false;
    //before anything, check to see if we're logged in!
    $scope.loading = true;
    $scope.playerStats = [{
        h: 0,
        name: 'ed',
        num: 20,
        numPerc: 33
    }, {
        h: 20,
        name: 'edd',
        num: 10,
        numPerc: 16
    }, {
        h: 40,
        name: 'eddy',
        num: 30,
        numPerc: 50
    }];
    miscFact.chkLoggedStatus().then(function(r) {
        console.log('DATA', r.data);
        if (!r.data.result) window.location.assign('./login');
        $scope.user = r.data.name;
        hintMaker(1, function() {
            miscFact.checkInGame(r.data.name).then(function(m) {

                if (m.data.game) {
                    //load map this player's in.
                    $scope.reloadGame(m.data.game);
                    $scope.gameSettingsPanel = 2;
                    $scope.isDead = !m.data.alive;
                    $scope.canJoin = false; //player cannot join a game while they're in one
                } else {
                    $scope.loading = false;
                    $scope.$digest();
                    //not in game!
                    hintMaker(2);
                }
            });

        });
    });
    $scope.biomeTypes = {
        warm: ['city', 'swamp', 'forest', 'plains', 'hills'],
        cold: ['frozen city', 'frozen swamp', 'boreal forest', 'tundra', 'mountain']
    };
    $scope.isInvis = function(ap) {
        return ap.terr == 'city' || ap.terr == 'forest' || ap.terr == 'hills' || ap.terr == 'frozen city' || ap.terr == 'boreal forest' || ap.terr == 'mountain';
    };
    $scope.btns = true;
    $scope.allGames = [];
    $scope.usrGames = function() {
        return $scope.allGames.filter((g) => {
            return g.creator == $scope.user;
        });
    };
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
        console.log('GAME', g);
        //finally, map stuff!
        mapFact.loadOneMap(g.mapId).then(function(m) {
            console.log('result of attempt to get 1 map', m);
            $scope.pickMap(m.data.mapData, g.mapId, true);
            $scope.loading = false;
            $scope.$digest();
            $scope.gameReady = true;
            hintMaker(7, function() {
                hintMaker(8);
            });
        });
    };
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

    $scope.getTerrStats = function(terr) {
        //this is NOT used for actually calculating terrain effects, as the actual combat calcs are done on the back-end. Instead, it simply creates labels for the user to tell what the effects of each terrain is.
        var terrLbls = {
            'swamp': '&#128065; &#128737; &#9760;',
            'plains': '&#128065; &#128481;',
            'forest': '&#10006; &#128059;',
            'hills': '&#10006; &#128737;',
            'city': '&#10006; &#128481; &#128587;',
            'frozen swamp': '&#10052; &#128065; &#128737; &#9760;',
            'tundra': '&#10052; &#128065; &#128481;',
            'boreal forest': '&#10052; &#10006; &#128059;',
            'mountain': '&#10052; &#10006; &#128737;',
            'frozen city': '&#10052; &#10006; &#128481; &#128587;'
        };
        return terrLbls[terr];
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
    $scope.pStatShow = false;
    $scope.newMap = function() {
        var smootz = 101 - $scope.smoothing,
            numZones = Math.round($scope.numCountries / 0.3);
        $scope.map = mapFact.GetVoronoi($scope.win.h, $scope.win.w, numZones, smootz);
        $scope.map.init();
        $scope.gameMenu = false;
        sandalchest.confirm("Confirm Map", "Do you want to accept this map?", function(r) {
            console.log('R FROM MAP CONFIRM', r);
            if (r) {
                $scope.map.save().then(function(sr) {
                    console.log('ASKING IF NEW GAME');
                    sandalchest.dialog('Start Game', `Do you want to start a new game with this map (${sr.data.id})?<hr/>Password: <input type='password' id='newGamePwd'> <button class='btn btn-danger' onclick="angular.element('body').scope().pwdExpl()" id='start-new-game-btn'>?</button>`, {
                        buttons: [{
                            text: 'Create Game',
                            close: true,
                            click: function() {
                                //use sr.id to make a new game.
                                var ngpwd = document.querySelector('#newGamePwd').value;
                                hintMaker(4, function() {
                                    fightFact.newGame(sr.data.id, $scope.user, ngpwd).then(function(g) {
                                        $scope.gameId = g.data.id;
                                        socket.emit('getGamePieces', { id: g.data.id });
                                        console.log('Done! Game made!');
                                        $scope.gameSettingsPanel = 2;
                                        socket.emit('getGames', { x: true });
                                        hintMaker(5)
                                    });
                                })
                            }
                        }, {
                            text: 'Cancel',
                            close: true,
                            click: function() {

                            }
                        }],
                        speed: 250
                    });
                    hintMaker(3);
                });
            } else {
                //user doesnt like this map(Q_Q). reset
                $scope.map = null;
                $scope.gameMenu = true;
                $scope.$digest();
            }
        });
    };
    $scope.pwdExpl = function() {
        sandalchest.alert('Protected Games', 'If you include a password, only players who have that password can join. Leave this blank if you want a public game!', {
            rotation: -5
        });
    };
    socket.emit('getGames', { x: true });
    $scope.loadMaps = function() {
        //load all OLD maps for a NEW game!
        mapFact.loadMaps().then(function(r) {
            console.log('MAPS', r);
            $scope.potentialMaps = r.data;
        });
    };
    socket.on('replaceMap', function() {
        //force reload of maps, since one got updated or deleted or something.
        $scope.loadMaps();
    });
    socket.on('allGames', function(g) {
        //this socket cmd basically refreshes the list of games.
        //now we check each game, and see if the old game we were in still exists. 
        $scope.canJoin = true;
        g.forEach((gi) => {
            if (gi.gameId == $scope.gameId) {
                $scope.canJoin = false;
            }
        });
        if ($scope.canJoin) $scope.gameId = null;
        console.log('FROM ALL GAMES', g);
        $scope.allGames = g;
        $scope.loadMaps();
        $scope.$digest();
    });
    socket.on('deadPlayer', function(p) {
        if (p.player === $scope.player) {
            sandalchest.alert('Dead', `Sorry, ${$scope.user}, you've died!`, function(e) {
                $scope.btns = false;
            });
        }
    });
    $scope.armyRightClick = function(ap) {
        var terrEffs = {
            'hills': ['&#128737; Defensive bonus - Increased chance for defender to win a conflict', '&#10006; No Visibility - Defending army number hidden'],
            'city': ['&#128481; Offensive bonus - Increased chance for attacker to win a conflict', '&#10006; No Visibility - Defending army numbers hidden', '&#128587; Recruiting - Small chance for defender to gain +1 army each turn (max of 10 armies)'],
            'swamp': ['&#128737; Defensive bonus - Increased chance for defender to win a conflict', '&#128065; Visibility - Defending army numbers known', '&#9760; Swamp Gas - Small chance for defender to lose 1 army per turn (may not lose all armies)'],
            'plains': ['&#128481; Offensive bonus - Increased chance for attacker to win a conflict', '&#128065; Visibility - Defending army numbers known'],
            'forest': ['&#10006; No Visibility - Defending army number hidden', '&#128059; Animal attacks - Small chance for defender to lose 1 army per turn (may not lose all armies)'],
            'mountain': ['&#128737; Defensive bonus - Increased chance for defender to win a conflict', '&#10006; No Visibility - Defending army number hidden', '&#10052; Cold Weather - Chance for both attacker and defender to lose one army after attack'],
            'frozen city': ['&#128481; Offensive bonus - Increased chance for attacker to win a conflict', '&#10006; No Visibility - Defending army numbers hidden', '&#128587; Recruiting - Small chance for defender to gain +1 army each turn (max of 10 armies)', '&#10052; Cold Weather - Chance for both attacker and defender to lose one army after attack'],
            'frozen swamp': ['&#128737; Defensive bonus - Increased chance for defender to win a conflict', '&#128065; Visibility - Defending army numbers known', '&#9760; Swamp Gas - Small chance for defender to lose 1 army per turn (may not lose all armies)', '&#10052; Cold Weather - Chance for both attacker and defender to lose one army after attack'],
            'tundra': ['&#128481; Offensive bonus - Increased chance for attacker to win a conflict', '&#128065; Visibility - Defending army numbers known', '&#10052; Cold Weather - Chance for both attacker and defender to lose one army after attack'],
            'boreal forest': ['&#10006; No Visibility - Defending army number hidden', '&#128059; Animal attacks - Small chance for defender to lose 1 army per turn (may not lose all armies)', '&#10052; Cold Weather - Chance for both attacker and defender to lose one army after attack']
        }
        return [
            [function() {
                return '<strong>Country:</strong> ' + ap.country;
            }],
            [function() {
                return '<strong>Player:</strong> &#' + ap.lbl + '; ' + ap.usr;
            }],
            [function() {
                return '<strong>Number of Armies:</strong> ' + ap.num;
            }],
            [function() {
                return '<strong>Terrain:</strong> ' + ap.terr;
            }],
            [function() {
                var terrEff = '<ul>';
                terrEffs[ap.terr].forEach((ef) => {
                    terrEff += '<li>' + ef + '</li>';
                })
                console.log(terrEff)
                return terrEff + '</ul>'
            }]
        ]
    }
    $scope.deleteMap = function(id) {
        sandalchest.confirm('Delete Map', 'Are you sure you want to delete map ' + id + '?', function(n) {
            if (n) {
                mapFact.delMap(id).then(function(r) {
                    if (r.data == 'logErr') return;
                });
            }
        });
    };
    $scope.delGame = function(id) {
        sandalchest.confirm('Delete Game', 'Are you sure you wanna delete this game? This isn\'t reversable!', function(delConf) {
            if (delConf) {
                fightFact.delGame(id).then(function(r) {
                    console.log('back from delGame thing');
                    if (r.data == 'wrongUser') {
                        sandalchest.alert('Hey! You can\'t delete that game!');
                    } else {
                        console.log('REMOVED GAME! REFRESHING DATA');
                        socket.emit('getGames', { x: true });
                    }
                });
            }
        });
    };
    $scope.pickTarg = false;//when true, this means we're picking the DESTINATION of an action (instead of the source)
    $scope.moveArmies = true;
    var debugMode = false; //allows us to pick our own dudes as targets, allowing testing of attack mode without another player
    $scope.pickCell = function(ap) {
        if ($scope.currPlayer && $scope.currPlayer != $scope.user) {
            return true; //not this player's turn
        }
        if ($scope.addMode && ap.usr == $scope.user) {
            sandalchest.dialog({
                buttons: [{
                    text: 'Add em!',
                    close: true,
                    click: function() {
                        var numNew = parseInt(document.querySelector('#numNewArms').value);
                        ap.num += numNew;
                        $scope.newArmies -= numNew;
                        if (!$scope.newArmies) {
                            $scope.addMode = false;
                            console.log('emitting to back end, new armies:', $scope.armyPieces)
                            socket.emit('armiesAdded', {
                                gameId: $scope.gameId,
                                armies: $scope.armyPieces
                            });
                        } else {
                            $scope.$digest();
                        }
                    }
                }, {
                    text: 'Cancel',
                    close: true,
                    click: function() {

                    }
                }],
                speed: 250
            }, 'Add Armies', `How many armies do you want to add to ${ap.country}?<br/><input type='number' id='numNewArms' max='${$scope.newArmies}'`);
            return true;
        } else if ($scope.srcCell && $scope.map.diagram.cells[$scope.srcCell].country == ap.country && ap.status > 0) {
            ap.status = 0;
            $scope.srcCell = null;
            $scope.targCell = null;
            $scope.pickTarg = false;
            return true;
        } else if (!$scope.pickTarg && ap.usr == $scope.user) {
            //if we're not in target pick mode and this piece's user is us.
            $scope.armyPieces.forEach((p) => {
                p.status = 0;
            });
            //picking source cell
            $scope.srcCell = $scope.map.getCellNumByName(ap.country);
            ap.status = 1;
            $scope.targCell = null;
            $scope.pickTarg = true;
            return true;
        } else if (!$scope.moveArmies) {
            if ($scope.pickTarg && (ap.usr != $scope.user || debugMode)) {
                //in target pick mode (have already picked source), target user is NOT us.
                if (!mapFact.isNeighbor($scope.map.diagram.cells, $scope.srcCell, $scope.map.getCellNumByName(ap.country))) {
                    sandalchest.alert("Uh Oh!", "Hey! You can't attack " + ap.country + " from " + $scope.map.diagram.cells[$scope.srcCell].country + "! It's too far away!", { speed: 250 });
                    return false;
                }
                $scope.targCell = $scope.map.getCellNumByName(ap.country);
                ap.status = 2;
                $scope.pickTarg = false;
            } else if ($scope.pickTarg && ap.usr == $scope.user) {
                sandalchest.alert("Uh Oh!", "Hey! You can't attack yourself at " + ap.country + "!", { speed: 250 });
            }
        } else {
            if ($scope.pickTarg && ap.usr == $scope.user) {
                if (!mapFact.isNeighbor($scope.map.diagram.cells, $scope.srcCell, $scope.map.getCellNumByName(ap.country))) {
                    sandalchest.alert("Uh Oh!", `Hey! You can't move armies to ${ap.country} from ${$scope.map.diagram.cells[$scope.srcCell].country}! It's too far away!`, { speed: 250 });
                    return false;
                }
                var srcNum = $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country).num;
                if (srcNum < 2) {
                    sandalchest.alert('Uh Oh!', 'You have too few armies in the source country to move armies (less than two). You cannot desert a country!', { speed: 250 });
                    return false;
                }
                if (ap.debuff=='noRecruit'){
                    sandalchest.alert('No Recruiting',`Low morale in ${ap.country} means you cannot move armies into that country this turn.`)
                }
                sandalchest.dialog({
                    buttons: [{
                        text: 'Move em!',
                        close: true,
                        click: function() {
                            console.log('wanna move', { num: parseInt(document.querySelector('#reqNumMove').value), usr: $scope.user, src: $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country), targ: ap, game: $scope.gameId });
                            socket.emit('moveArmies', { num: parseInt(document.querySelector('#reqNumMove').value), usr: $scope.user, src: $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country), targ: ap, game: $scope.gameId });
                            $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country).status = 0;
                            $scope.srcCell = null;
                            $scope.targCell = null;
                            ap.status = 0;
                            $scope.pickTarg = false;
                        }
                    }, {
                        text: 'Cancel',
                        close: true,
                        click: function() {
                            $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country).status = 0;
                            $scope.srcCell = null;
                            $scope.targCell = null;
                            ap.status = 0;
                            $scope.pickTarg = false;
                        }
                    }],
                    speed: 250
                }, 'Army Movement', `How many armies do you want to move from ${$scope.map.diagram.cells[$scope.srcCell].country} to ${ap.country}? You can move a maximum of ${srcNum} armies. <br/> <input type="number" id="reqNumMove" value='1' min='1' max='${srcNum}'>`);

            } else if ($scope.pickTarg && ap.usr != $scope.user) {
                sandalchest.alert('Uh Oh!', `${ap.country} is currently occupied by another player. You'll need to conquer it first to move your armies there!`);
            }
        }
    };
    $scope.joinGame = function(g, pwd) {
        fightFact.joinGame(g, $scope.user, pwd).then(function(r) {
            if (r.data == 'gameLogErr') {
                sandalchest.alert('Join Error', 'This game\'s private, and you\'ve unfortunately entered the wrong password!');
                return false;
            }else{
                window.location.reload();   
            }
            // console.log('JOINED GAME:', r);
            // socket.emit('getGames', { x: true });
        });
    };
    $scope.neighborTest = function(s, d) {
        console.log('tested cells are neighbors: ', mapFact.isNeighbor($scope.map.diagram.cells, s, d));
    };
    $scope.switchPlayMode = function() {
        sandalchest.confirm('Switch Modes', 'Are you sure you wanna stop moving armies and begin the attack phase?', function(res) {
            if (res && res !== null) {
                $scope.moveArmies = false;
                $scope.$digest();
                hintMaker(9)
            }
        });
    };
    $scope.checkMenuHint = function() {
        hintMaker(6);
    }
    $scope.pickMap = function(m, n, old) {
        //load an OLD map for a NEW game
        //map is a new map created just now
        //OR, if 'old' is true, reload an old map and use for old game
        //(i.e., rejoin player to game)
        console.log('pikmap data', m, n, old);
        $scope.map = mapFact.GetVoronoi(m.bbox.yb, m.bbox.xr, m.countryNames.length, 20);
        for (var p in m) {
            $scope.map[p] = m[p];
        }
        $scope.map.initLoad(m.img);
        // $scope.countryLbls = $scope.map.counLblObjs();
        $scope.gameMenu = false;
        if (!old) {
            //makin a new game with an old map
            sandalchest.dialog('New Game', `Making a new game!<hr/> Password (optional): <input type='password' id='newGamePwd'> <button class='btn btn-danger' onclick="angular.element('body').scope().pwdExpl()">?</button>`, {
                buttons: [{
                    text: 'Create Game',
                    close: true,
                    click: function() {
                        //use sr.id to make a new game.
                        var ngpwd = document.querySelector('#newGamePwd').value;
                        hintMaker(4, function() {
                            fightFact.newGame(n, $scope.user, ngpwd).then(function(g) {
                                $scope.gameId = g.data.id;
                                socket.emit('getGamePieces', { id: g.data.id });
                                console.log('Done! Game made!');
                                $scope.gameSettingsPanel = 2;
                                socket.emit('getGames', { x: true });
                                hintMaker(5);
                            });
                        })
                        $scope.armyPieces = [];
                    }
                }, {
                    text: 'Cancel',
                    close: true,
                    click: function() {

                    }
                }],
                speed: 250
            });
            hintMaker(3);
        } else {
            socket.emit('putInRoom', { id: $scope.gameId });
            $scope.armyPieces = [];
        }
    };
    $scope.getPStats = function(a, p, im) {
        $scope.playerStats = [];
        var total = 0;
        for (var i = 0; i < p.length; i++) {
            var pStatCol = 360 * i / p.length,
                playerObj = {
                    num: 0,
                    h: pStatCol,
                    name: '&#' + im[i] + '; ' + p[i],
                    numPerc: 0
                }
            for (var j = 0; j < a.length; j++) {
                if (a[j].user == p[i]) {
                    total++;
                    playerObj.num++
                }
            }
            $scope.playerStats.push(playerObj);
        }
        //now loop thru again for percents
        for (var k = 0; k < $scope.playerStats.length; k++) {
            $scope.playerStats[k].numPerc = 100 * $scope.playerStats[k].num / total;
        }
        console.log('PLAYER STATS:', $scope.playerStats, 'TOTAL', total)
    };
    socket.on('updateArmies', function(d) {
        console.log('UPDATE ARMIES', d);
        d.players.forEach((p, i) => {
            $scope.currGamePlayers[p] = d.avas[i];
        });
        $scope.armyPieces = fightFact.placeArmies($scope.map, d.armies, $scope.currGamePlayers);
        $scope.currPlayer = d.players[d.turn];
        $scope.getPStats(d.armies, d.players, d.avas);
        $scope.$digest();
    });
    socket.on('gameReady', function(d) {
        $scope.gameIsReady = true;
        socket.emit('getGamePieces', d);
        console.log('AT GAMEREADY, D IS', d);
    });
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
                    socket.emit('gameStarted', r);
                    window.location.reload();
                });
            }
        });
    };
    socket.on('putInGame', (c) => {
        console.log('PUT IN GAME', c);
        if (c.data.players.indexOf($scope.user) > -1) {
            socket.emit('putInRoom', c.data);
        }
    });
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
            fightFact.doFight($scope.user, $scope.getAPByName($scope.map.diagram.cells[s].name), $scope.getAPByName($scope.map.diagram.cells[d].name), ra, rd, $scope.gameId);
            $scope.srcCell = null;
            $scope.targCell = null;
        }
    };
    $scope.getAPByName = function(name) {
        for (var i = 0; i < $scope.armyPieces.length; i++) {
            if ($scope.armyPieces[i].country == name) {
                return $scope.armyPieces[i];
            }
        }
        return false;
    };
    $scope.startAttack = function() {
        console.log('SOURCE CELL', $scope.map.diagram.cells[$scope.srcCell]);
        if ((!$scope.srcCell && $scope.srcCell !== 0) || (!$scope.targCell && $scope.targCell !== 0)) {
            sandalchest.alert('Attack Issue', 'You need both an attacker and a target!');
        } else if($scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).debuff=='noAttack'){
            sandalchest.alert("Can't Attack",`Due to a natural disaster, your armies in ${$scope.map.diagram.cells[$scope.srcCell].name} are in disarray! You can't attack from there this turn.`)
        } else if ($scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name) && $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num < 2) {
            sandalchest.alert("Not Enough Armies", `You can't attack from ${$scope.map.diagram.cells[$scope.srcCell].name}! Attacking countries need at least two armies: One to attack, and one to stay home!`);
        } else {
            var maxPain = $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num < 5 ? $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num - 1 : 3;
            sandalchest.prompt('Army Strength', `How many armies do you wanna attack with? You can attack with at most ${maxPain} armies.`, function(res) {
                res = parseInt(res);
                if (isNaN(res) || res === 0) {
                    return false;
                }
                console.log($scope.map.diagram.cells[$scope.srcCell].name, 'attacking', $scope.map.diagram.cells[$scope.targCell].name, 'with', res, 'armies.');
                $scope.doAttack($scope.srcCell, $scope.targCell, res);
            });
            hintMaker(10)
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
            socket.emit('getGamePieces', { id: $scope.gameId })
        }
        console.log('from rcvDoFight, we get', res, defr, atkr);
        replProps.forEach((p) => {
            defr[p] = res.cd[p];
            atkr[p] = res.ca[p];
        });
        $scope.$apply();
    });
    $scope.nextTurn = function() {
        sandalchest.confirm('End Turn', 'Are you sure you want to end your turn?', function(res) {
            if (res && res !== null) {
                //NEED TO ASSIGN ARMY PIECE DATA TO MAP HERE!
                fightFact.nextTurn($scope.map, $scope.gameId, $scope.user);
            }
        });
    };
    socket.on('turnSwitch', function(t) {
        $scope.currPlayer = t.usr;
        if (t.usr == $scope.user) {
            //allow player to add armies.
            $scope.newArmies = t.newA;
            $scope.addMode = true;
            sandalchest.alert('new armies:', t.newA.toString())
        }
        console.log('turnSwitch data:', t)
            // disastFact.doDisasts(t.armies).then(function(r){

        // });
        var armyForDisast = angular.copy(t.armies)
        var dis = disastFact.doDisasts(armyForDisast);
        console.log('LEN COMPARE',$scope.armyPieces.length,$scope.map.diagram.cells.length)
        if (dis.dis.length) {
            $scope.armyPieces = dis.cells;
            var disastList = '<li>' + dis.dis.join('</li><li>') + '</li>'
            sandalchest.alert(`Disaster has struck!`,`<ul>${disastList}</ul>`)
        }
        $scope.$digest();
    });
    $scope.testDisasts = function() {
        var armyForDisast = angular.copy($scope.armyPieces);
        disastFact.doDisasts(armyForDisast);
    }
});
