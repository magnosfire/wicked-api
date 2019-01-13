var express = require("express");
var countryRouter = express.Router();
var countryController = require("./countryController")();

var router = function () {

    countryRouter.route("/")
        .get(countryController.getCountries)
        .post(countryController.newCountry);



    return countryRouter;
};

module.exports = router;
