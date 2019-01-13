var mongoose = require("mongoose");

var countrySchema = mongoose.Schema({

    countryName        : String


});


module.exports = mongoose.model("Country", countrySchema);