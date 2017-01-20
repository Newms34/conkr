var mongoose = require('mongoose'),
    crypto = require('crypto');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var skillSchema = new mongoose.Schema({
    mapId: String, //which map this applies to
    armies: [{
        user: String, //userId
        country: String, //country name
        num: Number, //number (i.e., strength) of army
        terr:String
    }],
    players: [String], //list of players for convenience
    deadPlayers:[String],//list of players who have been defeated (i.e., had their last army conquered)
    gameId: String, //ID of game
    creator: String, //ID of creator
    avas: [Number], //avatar(number) of each player.
    inPlay: { type: Boolean, default: false }, //if this is true, the game is in play and new players cannot join
    turn: { type: Number, default: 0 }, //whose turn is it anyway?
    pass: { type: String, default: null },
    salt: String,
    protected: { type: Boolean, default: false }
}, { collection: 'Game' });
var generateSalt = function() {
    return crypto.randomBytes(16).toString('base64');
};
var encryptPassword = function(plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};
skillSchema.statics.generateSalt = generateSalt;
skillSchema.statics.encryptPassword = encryptPassword;
skillSchema.methods.correctPassword = function(candidatePassword) {
    console.log('this games condiments:', this.salt, 'and its pwd:', this.pass)
    return encryptPassword(candidatePassword, this.salt) === this.pass;
};
mongoose.model('Game', skillSchema);
