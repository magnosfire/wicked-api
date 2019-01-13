var mongoose = require("mongoose");
const async = require("async");

//---------------MODELS--------------------------
var City = require("./cityModel");
//------------END--MODELS------------------------

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var cityController = function (app) {

    var newCity = function (req,res) {

        mongoose.connect(url, function (err, city) {

            var city = new City();

            city.provinceName = req.body.provinceName;
            city.cityName = req.body.cityName;
            city.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                res.json({code: 200,
                    message: "City created with success." ,
                    data: city});
                mongoose.disconnect();
            });

        });

    };

    const getAllCitiesByCitiesID = function (req, res) {

        req.connection.query('SELECT cities.id, cities.name FROM cities WHERE cities.region_id = ?',req.params.provinceID, function (err, cityResult) {
            if (err) {
            } else {
                if (cityResult) {
                    res.json(cityResult)
                } else {

                }
            }
        });

    };

    getLocationInformation = function(req, res) {

        const cityID = req.params.cityID;

        let locationInformation = {
            cityID: '',
            cityName: '',
            provinceID: '',
            provinceName: '',
            countryID: '',
            countryName: ''
        };

        let countryList;
        let provinceList;
        let cityList;

        async.parallel([
            function(callback){
                
                async.waterfall([
                    function(callback) {

                        req.connection.query("SELECT cities.id, cities.name, cities.region_id FROM cities WHERE cities.id = ?",
                                [cityID], (err, result) => {
                            if(err) {
                                
                                callback(err,null);

                            } else {

                                locationInformation.cityID = result[0].id;
                                locationInformation.cityName = result[0].name;

                                callback(null,result[0].region_id);


                            }
                        });

                    }, function(pronviceID, callback) {

                        req.connection.query("SELECT regions.id, regions.name, regions.country_id FROM regions WHERE regions.id = ?",
                                [pronviceID], (err, result) => {
                            if(err) {
                                
                                callback(err,null);

                            } else {

                                locationInformation.provinceID = pronviceID;
                                locationInformation.provinceName = result[0].name;

                                callback(null,result[0].country_id);


                            }
                        });

                    }, function(countryID, callback){


                        req.connection.query("SELECT countries.id, countries.name FROM countries WHERE countries.id = ?",
                                [countryID], (err, result) => {
                            if(err) {
                                
                                callback(err,null);

                            } else {

                                locationInformation.countryID = countryID;
                                locationInformation.countryName = result[0].name;

                                callback(null,result[0].id);


                            }
                        });

                    }
                ], function (err,results){

                    callback(null, 200);

                });

            },function(callback){
                
                async.parallel([
                    function(callback){

                        req.connection.query("SELECT countries.id, countries.name FROM countries", (err, result) => {
                            if(err) {
                                
                                callback(err,null);

            
                            } else {

                                countryList = result;
                                
                                callback(null,result);

                            }
                        });
                        

                    },function(callback){
                        
                        req.connection.query("SELECT regions.id, regions.name FROM regions", (err, result) => {
                            if(err) {
                                
                                callback(err,null);

            
                            } else {

                                provinceList = result;
                                
                                callback(null,result);

                            }
                        });
                        
                    },function(callback){
                        
                        req.connection.query("SELECT cities.id, cities.name FROM cities", (err, result) => {
                            if(err) {
                                
                                callback(err,null);

            
                            } else {

                                cityList = result;
                                
                                callback(null,result);

                            }
                        });
                        

                    }
                ], function(err, results) {

                    callback(null,200);
                });

            }

        ], function(err, results) { 

            if(err) {
                res.json({code:400});
            } else {
                res.json({code:200, 
                          locationInformation: locationInformation,
                          countryList: countryList,
                          provinceList: provinceList,
                          cityList: cityList})
            }

        });


    

    }

    return{
        newCity : newCity,
        getAllCitiesByCitiesID : getAllCitiesByCitiesID,
        getLocationInformation: getLocationInformation
    };


};

module.exports = cityController;