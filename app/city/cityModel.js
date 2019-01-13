var mongoose = require("mongoose");

var citySchema = mongoose.Schema({

    provinceName         : String,
    cityName             : String


});


module.exports = mongoose.model("City", citySchema);