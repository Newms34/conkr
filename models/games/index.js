var mongoose = require('mongoose');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var skillSchema = new mongoose.Schema({
    mapId: String, //which map this applies to
    armies: [{
        user: String,//userId
        country: String,//country name
        num:Number//number (i.e., strength) of army
    }],
    players:[String],//list of players for convenience
    gameId:String,//ID of game
    creator:String,//ID of creator
    inPlay:{type:Boolean, default:false},//if this is true, the game is in play and new players cannot join
    turn:{type:Number,default:0}//whose turn is it?
}, { collection: 'Game' });

mongoose.model('Game', skillSchema);
