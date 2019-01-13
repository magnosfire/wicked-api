var mongoose = require("mongoose");
var bcrypt   = require('bcrypt-nodejs');

var productSchema = mongoose.Schema({

    productTitle        : String,
    productorID         : String,
    productorName       : String,
    productDescription  : String,
    productCategory     : String,
    productImage        : String,
    creationData        : Date

});

module.exports = mongoose.model("Product", productSchema);