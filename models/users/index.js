var mongoose = require('mongoose'),
    crypto = require('crypto');
//we're just testing password encryption here!
var usrSchema = new mongoose.Schema({
    name: String, //name of the user
    totalScore: Number,
    pass: String,
    salt: String
}, { collection: 'User' });

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function() {
    return crypto.randomBytes(16).toString('base64');
};
var encryptPassword = function(plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};
usrSchema.statics.generateSalt = generateSalt;
usrSchema.statics.encryptPassword = encryptPassword;
usrSchema.methods.correctPassword = function(candidatePassword) {
    console.log('this users condiments:', this.salt, 'and their pwd:', this.pass)
    return encryptPassword(candidatePassword, this.salt) === this.pass;
};


mongoose.model('User', usrSchema);
