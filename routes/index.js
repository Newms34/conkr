const express = require('express'),
    router = express.Router();
router.use('/game', require('./game'));
router.use('/user', require('./user'));
router.use('/map', require('./map'));

router.get('/', function(req, res, next) {
    res.sendFile('index.html', { "root": './views' });
});

router.get('/login', function(req, res, next) {
    res.sendFile('login.html', { "root": './views' });
});

module.exports = router;
