var mongoose = require('mongoose');
//note that maps are usable for multiple games. As such, this purely stores a map (plus country names, NOT army data)
var skillSchema = new mongoose.Schema({
    id: String, //id of map
    mapData: {
        countryNames: [String],
        bbox: {
            xl: Number,
            xr: Number,
            yb: Number,
            yt: Number
        },
        sites:[{}],
        numsRelaxed:Number,
        diagram:{},
        doneCouns:[],
        currCont:String,
        cellCenters: [{ x: Number, y: Number, name:String}],
        img:String
    }
}, { collection: 'Map' });

mongoose.model('Map', skillSchema);
