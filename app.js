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
app.use(session({
    cookieName: 'session', // cookie name dictates the key name added to the request object
    secret: 'doctrix musica optima ut ei marcescem et eam felicem esse spero', // should be a large unguessable string
    duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
}));
app.use('/', routes);


var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket) {
    //default socket stuff for just message sending.
    //this does not get put in separate rooms.
    socket.on('sendMsg', function(m) {
        io.emit('newMsg', m)
    });
    socket.on('sendDoFight', function(d) {
        var cellChanges = sockmod.doFight(d);
        io.sockets.in(socket.room).emit('rcvDoFight', cellChange);
    })
    socket.on('sendAddArmies', function(d) {
        var armyChanges = sockmod.newArmies;
        io.sockets.in(socket.room).emit('rcvAddArmies', armyChanges)
    })
    socket.on('testRoom', function(t) {
        console.log('TEST ROOM', t)
        io.sockets.in(socket.room).emit('roomTestCli', { t: t, msg: 'hi from server!' + socket.room })
    })
    socket.on('gameStarted', function(r) {
        //game has been started. send message to all players, so they can connect
        io.emit('putInGame', r);
        //also re-send allgames, since this game can no longer be joined!
        mongoose.model('Game').find({}, function(err, docs) {
            io.emit('allGames', docs);
        })
    })
    socket.on('putInRoom',function(d){
        socket.join(d.id);
        //after this, all players should be in the correct room. can also be used for a player rejoining a game
    })
    socket.on('getGames', function(o) {
        mongoose.model('Game').find({}, function(err, docs) {
            io.emit('allGames', docs);
        })
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
