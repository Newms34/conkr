var mongoose = require('mongoose');
//note that maps are usable for multiple games. As such, this purely stores a map (plus country names, NOT army data)
var skillSchema = new mongoose.Schema({
    id: String, //id of map
    mapData:{}
},{collection: 'Map'});

mongoose.model('Map', skillSchema);