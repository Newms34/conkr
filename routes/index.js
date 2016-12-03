var express = require('express'),
    router = express.Router(),
    path = require('path'),
    models = require('../models/'),
    session = require('client-sessions');
router.use('/game', require('./game'));
router.use('/user', require('./user'));
router.use('/map', require('./map'));

router.get('/', function(req, res, next) {
    res.sendFile('index.html', { "root": './views' });
});

module.exports = router;
