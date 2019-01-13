var mongoose = require("mongoose");

//---------------MODELS--------------------------
var Country = require("./countryModel");
//------------END--MODELS------------------------

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var countryController = function (app) {

    var newCountry = function (req,res) {

        mongoose.connect(url, function (err, country) {

            var country = new Country();

            country.countryName = req.body.countryName;

            country.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                res.json({code: 200,
                    message: "Country created with success." ,
                    data: country});
                mongoose.disconnect();
            });

        });

    };

    const getCountries = function (req,res) {

        req.connection.query('SELECT countries.id, countries.name, IF(countries.id = 231, 1, 0) AS checked FROM countries', function (err, countriesResult) {
            if (err) {
            } else {
                const result = countriesResult[0];
                if (result) {
                    res.json(countriesResult)
                } else {
                    return callback(null,{username: {isValid: true, username: username}});
                }
            }
        });

    };

    return{
        newCountry : newCountry,
        getCountries : getCountries
    };


};

module.exports = countryController;