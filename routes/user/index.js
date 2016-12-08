var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.post('/reset', function(req, res, next) {
    var un = req.body.name,
        pwd = req.body.pass;
    mongoose.model('User').findOne({ 'name': un }, function(err, usr) {
        console.log('usr', usr)
        if (!usr) {
            console.log('no user!')
            res.send('no')
        } else {
            if (usr.correctPassword(pwd)) {
                var salt = mongoose.model('User').generateSalt();
                var resUsr = {
                    totalScore: 0,
                    salt: salt,
                    pass: mongoose.model('User').encryptPassword(pwd, salt),
                    inProgGames: []
                }
                mongoose.model('User').update({ 'name': un }, resUsr, function(r) {
                    console.log('reset!')
                    res.send('yes')
                })
            } else {
                console.log('wrong pwd!')
                res.send('no')
            }
        }
    })
})
router.post('/save', function(req, res, next) {
    var newData = req.body,
        un = req.body.name;
    console.log('body', req.body, 'sesh', un)
    console.log('inventory:', req.body.equip.inv)
    mongoose.model('User').update({ 'name': un }, newData, function(err, usr) {
        mongoose.model('User').findOne({ 'name': un }, function(err, usr) {
            console.log('tried to find user we just saved. Result is', usr, 'err is', err)
                // console.log('current cell of user:',usr.currentLevel.loc)
            req.session.user = usr;
            res.send(true);
        })
    })
})
router.get('/currUsrData', function(req, res, next) {
    //get current user data so we can update the front-end fields
    if(!req.session.user){
        res.send('Error! Not logged in!');
        return;
    }
    mongoose.model('User').findOne({ 'name': req.session.user.name }, function(err, usr) {
        res.send(usr);
    })
})
router.post('/new', function(req, res, next) {
    //record new user
    var un = req.body.user,
        pwd = req.body.password;
    mongoose.model('User').findOne({ 'name': un }, function(err, user) {
        if (!user) {
            //this user does not exist yet, so 
            //go ahead and record their un and pwd
            //then make a new user!
            var salt = mongoose.model('User').generateSalt();
            var newUser = {
                name: un,
                totalScore: 0,
                salt: salt,
                pass: mongoose.model('User').encryptPassword(pwd, salt),
                inProgGames: []
            }
            console.log(newUser);
            mongoose.model('User').create(newUser);
            res.send('saved!')
        } else {
            res.send('DUPLICATE')
        }
    })
})
router.get('/nameOkay/:name', function(req, res, next) {
    mongoose.model('User').find({ 'name': req.params.name }, function(err, user) {
        if (!user.length) {
            //this user does not exist yet. send okay to frontend
            res.send('okay');
        } else {
            res.send('bad');
        }
    });
});
router.post('/login', function(req, res, next) {
    mongoose.model('User').findOne({ 'name': req.body.user }, function(err, usr) {
        console.log('USER FROM LOGIN:', usr)
        if (err || !usr || usr == null) {
            //most likely, this user doesn't exist.
            res.send('no');
        } else if (usr.correctPassword(req.body.password)) {
            //woohoo! correct user!
            //important note here: we must set all this session stuff, etc BEFORE
            //we send the response. As soon as we send the response, the server considers us "done"!
            req.session.user = usr;
            res.send('yes');
        } else {
            res.send('no');
        }
    })
});
router.get('/chkLog', function(req, res, next) {
    console.log('checking login', req.session)
    if (req.session.user) {
        res.send({result:true,name:req.session.user.name});
    } else {
        res.send(false);
    }
});
router.get('/logout', function(req, res, next) {
    /*this function logs out the user. It has no confirmation stuff because
    1) this is on the backend
    2) this assumes the user has ALREADY said "yes", and
    3) logging out doesn't actually really require any credentials (it's logging IN that needs em!)
    */
    console.log('usr sez bai');
    req.session.reset();
    res.send('logged')
})

