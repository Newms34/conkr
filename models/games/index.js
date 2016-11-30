var mongoose = require('mongoose');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var skillSchema = new mongoose.Schema({
    mapId: String, //which map this applies to
    armies: [{
        user: String,
        country: Number,//country as number
        num:Number,//number (i.e., strength) of army
    }]
}, { collection: 'Game' });

mongoose.model('Game', skillSchema);
