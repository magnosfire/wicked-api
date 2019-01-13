var mongoose = require("mongoose");

var provinceSchema = mongoose.Schema({

    countryName         : String,
    provinceName        : String


});


module.exports = mongoose.model("Province", provinceSchema);