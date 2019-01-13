var mongoose = require("mongoose");

//---------------MODELS--------------------------
var Province = require("./provinceModel");
//------------END--MODELS------------------------

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var provinceController = function (app) {

    var newProvince = function (req,res) {

        mongoose.connect(url, function (err, province) {

            var province = new Province();

            province.countryName = req.body.countryName;
            province.provinceName = req.body.provinceName;
            province.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                res.json({code: 200,
                    message: "Province created with success." ,
                    data: province});
                mongoose.disconnect();
            });

        });

    };

    const getAllProvincesByCountryID = function (req, res) {

        req.connection.query('SELECT regions.id, regions.name FROM regions WHERE regions.country_id = ?',req.params.countryID, function (err, provincesResult) {
            if (err) {
            } else {
                const result = provincesResult;
                if (result) {
                    res.json(provincesResult)
                } else {

                }
            }
        });

    };

    return{
        newProvince : newProvince,
        getAllProvincesByCountryID : getAllProvincesByCountryID
    };


};

module.exports = provinceController;