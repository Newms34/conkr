var express = require('express'),
    router = express.Router(),
    path = require('path'),
    models = require('../models/'),
    session = require('client-sessions');

router.get('/', function(req, res, next) {
    res.sendFile('index.html', { "root": './views' });
});

module.exports = router;
