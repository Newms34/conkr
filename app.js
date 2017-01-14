var express = require('express'),
    logger = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    config = require('./.config'),
    session = require('client-sessions'),
    mongoose = require('mongoose'),
    sockmod = require('./socketmodules');
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

//use stuff
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'views')));
var cookieSettings = {
    cookieName: 'session', // cookie name dictates the key name added to the request object
    secret: 'doctrix musica optima ut ei marcescem et eam felicem esse spero', // should be a large unguessable string
    duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
}
app.use(session(cookieSettings));
app.use('/', routes);


var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookie = require('cookie'),
    cookieParser = require('cookie-parser');
io.on('connection', function(socket) {
    //default socket stuff for just message sending.
    //this does not get put in separate rooms.
    socket.on('sendMsg', function(m) {
        if (m.local && m.local != null) {
            io.sockets.in(socket.room).emit('newMsg', m)
        }
        io.emit('newMsg', m);
    });
    socket.on('refreshMap', function(r) {
        io.emit('replaceMap');
    })
    socket.on('sendDoFight', function(d) {
        var actualUsr = sockmod.getAuthUsr(cookieSettings, cookie.parse(socket.handshake.headers.cookie).session),
            claimedUsr = d.user;
        mongoose.model('Game').findOne({ gameId: d.gameId }, function(err, doc) {
            if (err) return;
            if (!doc) return;
            //NEED TO SAVE GAME!
            if (!actualUsr || actualUsr != claimedUsr) {
                //basically, we're confirming that the user is who they say they are with socket's equivalent of req.session
                console.log(actualUsr, 'is not', claimedUsr);
                io.sockets.in(d.gameId).emit('falseUser', { usr: d.usr })
                return;
            } else if (doc.players[doc.turn] !== d.user) {
                io.sockets.in(d.gameId).emit('wrongTurn', { usr: d.user }); //user tried to take turn when it wasnt their turn.
            } else {
                console.log('socket', socket)
                var cellChanges = sockmod.doFight(d.ca, d.cd, d.ra, d.rd); //ch-ch-ch-changes!
                doc.armies.forEach((a) => {
                    if (a.country == cellChanges.ca.country) {
                        a.num = cellChanges.ca.num;
                    } else if (a.country == cellChanges.cd.country) {
                        a.num = cellChanges.cd.num;
                        if (cellChanges.status) {
                            a.user = cellChanges.ca.user;
                        }
                    }
                })
                doc.save();
                io.sockets.in(d.gameId).emit('rcvDoFight', cellChanges);
            }
        });
    });
    socket.on('sendAddArmies', function(d) {
        var armyChanges = sockmod.newArmies;
        io.sockets.in(socket.room).emit('rcvAddArmies', armyChanges);
    });
    socket.on('testRoom', function(t) {
        console.log('TEST ROOM', t)
        io.sockets.in(socket.room).emit('roomTestCli', { t: t, msg: 'hi from server!' + socket.room })
    })
    socket.on('gameStarted', function(doc) {
        //game has been started. send message to all players, so they can connect
        io.emit('putInGame', doc);
        //also re-send allgames, since this game can no longer be joined!
        mongoose.model('Game').find({}, function(err, docs) {
            io.emit('allGames', docs);
        })
    })
    socket.on('putInRoom', function(d) {
        console.log('socket now in room', d.id)
        socket.join(d.id);
        io.sockets.in(d.id).emit('gameReady', d);
        //after this, all players should be in the correct room. can also be used for a player rejoining a game
    })
    socket.on('getGames', function(o) {
        mongoose.model('Game').find({}, function(err, docs) {
            io.emit('allGames', docs);
        })
    })
    socket.on('getGamePieces', function(id) {
        console.log('GET GAME PIECES', id)
        var theId = id.id || id.gameId;
        mongoose.model('Game').findOne({ 'gameId': theId }, function(err, doc) {
            console.log('found game', id, ' and now sending game pieces')
            io.sockets.in(theId).emit('updateArmies', doc);
        })
    })
    socket.on('nextTurn', function(d) {
        //this function, on confirms, switches the turn of a particular game to the next user.
        var actualUsr = sockmod.getAuthUsr(cookieSettings, cookie.parse(socket.handshake.headers.cookie).session),
            claimedUsr = d.usr;
        mongoose.model('Game').findOne({ gameId: d.game }, function(err, doc) {
            if (err) {
                console.log('game find err', err)
                return;
            }
            if (!doc) {
                console.log('game not found', doc)
                return;
            }
            if (!actualUsr || actualUsr != claimedUsr) {
                //basically, we're confirming that the user is who they say they are with socket's equivalent of req.session
                console.log(actualUsr, 'is not', claimedUsr);
                io.sockets.in(d.game).emit('falseUser', { usr: d.usr })
                return;
            } else if (doc.players[doc.turn] !== d.usr) {
                io.sockets.in(d.game).emit('wrongTurn', { usr: d.user }); //user tried to switch turns when it wasnt their turn.
            } else {
                console.log('Switching turn!')
                doc.turn++;
                if (doc.turn >= doc.players.length) doc.turn = 0;
                //we need to add armies to this new player.

                doc.armies = sockmod.addArmies(d.conts, doc.armies, doc.players[doc.turn]);
                var multPlayers = false;
                while (!doc.armies) {
                    //this player extinct!
                    //note that we're putting this in a loop, since it's entirely possible for a very powerful player to eliminate multiple enemies in ONE turn.
                    io.sockets.in(d.game).emit('deadPlayer', { p: doc.players[doc.turn] })
                    doc.deadPlayers.push(doc.players.slice(doc.turn, 1));
                    multPlayers = true; //A player was deleted. This means the last remaining player won (and didnt just create a game to level themselves)
                    if (doc.turn >= doc.players.length) doc.turn = 0;
                    doc.armies = sockmod.addArmies(d.conts, doc.armies, doc.players[doc.turn]);
                }
                doc.save();
                if (actualUsr == doc.players[doc.turn]) {
                    io.sockets.in(d.game).emit('endGame', { winner: actualUsr })
                    //now update usr model to add 1 win!
                    //Note that this only happens if we've eliminated another player, which prevents the user from simply 'winning' one-person games to cheat level
                    if (multPlayers) {
                        mongoose.model('User').findOne({ name: d.usr }, function(err, doc) {
                            doc.totalScore++;
                            doc.save();
                            io.emit('newScores');
                        })
                    }
                } else {
                    io.sockets.in(d.game).emit('turnSwitch', {
                        id: d.game,
                        usr: doc.players[doc.turn]
                    })
                }
                console.log('Turn for game', d.game, 'successfully switched to', doc.players[doc.turn])
            }
        });
    })
    socket.on('moveArmies', function(d) {
        var actualUsr = sockmod.getAuthUsr(cookieSettings, cookie.parse(socket.handshake.headers.cookie).session),
            claimedUsr = d.usr;
        mongoose.model('Game').findOne({ gameId: d.game }, function(err, doc) {
            if (err) {
                console.log('Army move err!', err)
                return;
            }
            if (!doc) {
                console.log('game not found', doc)
                return;
            }
            if (!actualUsr || actualUsr != claimedUsr) {
                //basically, we're confirming that the user is who they say they are with socket's equivalent of req.session
                console.log(actualUsr, 'is not', claimedUsr);
                io.sockets.in(d.game).emit('falseUser', { usr: d.usr })
                return;
            } else if (doc.players[doc.turn] !== d.usr) {
                io.sockets.in(d.game).emit('wrongTurn', { usr: d.user }); //user tried to switch turns when it wasnt their turn.
            } else {
                console.log('Moving armies!\nBefore:', doc.armies)
                doc.armies.forEach((a) => {
                    if (a.country == d.src.country) {
                        console.log('From', a)
                        a.num -= d.num;
                    } else if (a.country == d.targ.country) {
                        console.log('To', a)
                        a.num += d.num;
                    }
                });
                doc.save();
                io.sockets.in(d.game).emit('updateArmies', doc);
            }
        });
    })
});
io.on('error', function(err) {
    console.log("SocketIO error was", err)
});
//set port, or process.env if not local
http.listen(process.env.PORT || 9264);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message,
        error: {}
    });
});
