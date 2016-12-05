var mongoose = require('mongoose');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var skillSchema = new mongoose.Schema({
    mapId: String, //which map this applies to
    armies: [{
        user: String,//userId
        country: String,//country name
        num:Number,//number (i.e., strength) of army
    }],
    gameId:String//ID of game
}, { collection: 'Game' });

mongoose.model('Game', skillSchema);
