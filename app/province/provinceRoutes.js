var express = require("express");
var provinceRouter = express.Router();
var provinceController = require("./provinceController")();

var router = function () {
    
    provinceRouter.route("/")
        .post(provinceController.newProvince);

    provinceRouter.route("/:countryID")
        .get(provinceController.getAllProvincesByCountryID);


    return provinceRouter;
};

module.exports = router;
