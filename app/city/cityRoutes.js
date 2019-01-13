var express = require("express");
var cityRouter = express.Router();
var cityController = require("./cityController")();

var router = function () {

    cityRouter.route("/")
        .post(cityController.newCity);

    cityRouter.route("/:provinceID")
        .get(cityController.getAllCitiesByCitiesID);

    cityRouter.route("/getLocationInformation/:cityID")
        .get(cityController.getLocationInformation);



    return cityRouter;
};

module.exports = router;
