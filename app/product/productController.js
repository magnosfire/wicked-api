var mongoose = require("mongoose");
var dateTime = require('node-datetime');
var async = require('async');

//---------------MODELS--------------------------
var Product = require("./productModel");
//------------END--MODELS------------------------

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var productController = function () {

    var newproduct = function (req,res) {

        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');

        mongoose.connect(url, function (err, product) {

            var product = new Product();

            product.productTitle             = req.body.productTitle;
            product.productorID              = req.body.productorID;
            product.productorName            = req.body.productorName;
            product.productDescription       = req.body.productDescription;
            product.productCategory          = req.body.productCategory;
            product.productImage             = req.body.productImage;
            product.creationData             = formatted;

            product.save(function (err) {
                if (err) {
                    return res.send(err);
                }
                res.json({
                    code: 200,
                    message: "Product created with sucess.",
                    data: product
                });
                mongoose.disconnect();
            });


        });
    };

    var updateProduct = function (req,res) {
        mongoose.connect(url, function (err, job) {
            Product.findById(req.body.productID, function (err,job) {

                product.productTitle             = req.body.productTitle;
                product.productDescription       = req.body.productDescription;
                product.productImage             = req.body.productImage;

                if(err){
                    res.json({info: "error during find job", error: err});
                }
                if(product){
                    //_.merge(job, req.body);
                    product.save(function (err) {
                        if(err){
                            res.json({info: "error durging job update", error: err});
                        }
                        res.json({info: "Job updated successfully"});
                    });
                }
                else{
                    res.json({info: "job not found"});
                }
            });
        });
    };

    var getAllProducts = function (req,res){
        mongoose.connect(url, function (err, product) {
            Product.find(function (err,product) {
                if(err){
                    res.json({info: "error during find product", error: err});
                }
                res.json({info: "Product found successfully", data:product});
                mongoose.disconnect();
            });
        });
    };

    var getAllProductsByUserId = function (req,res){

        var productorID = req.body.id;
        mongoose.connect(url, function (err, product) {
            Product.find({productorID: productorID},function (err,product) {
                if(err){
                    res.json({info: "error during find employment", error: err});
                }else {
                    res.json({info: "Product found successfully", data: product});
                }
                mongoose.disconnect();
            });
        });
    };

    var getAllProductsByCategory = function (req,res){
        var category = req.body.category;
        mongoose.connect(url, function (err, product) {
            Product.find({productCategory: category}).sort({creationData: 'desc'}).exec(function (err,product) {
                if(err){
                    res.json({info: "error during find employment", error: err});
                }else {
                    res.json({info: "Product found successfully", data: product});
                }
                mongoose.disconnect();
            });
        });
    };

    var getUpdateProduct = function (req, res) {

        var productID = req.body.productID;

        mongoose.connect(url, function (err, product) {

            Product.findById(productID, function (err, product) {

                if(product){

                    res.json({code: 200, product: product});

                }
                else {
                    res.json({info: "Product found successfully", data: product});
                }

                mongoose.disconnect();

            });


        });

    };

    var updateProduct = function (req, res) {

        var data = req.body;

        mongoose.connect(url, function (err, product) {
            Product.findById(data.productID, function (err, product) {

                product.productTitle                = data.productTitle;
                product.productCategory                = data.productCategory;
                product.productImage                = data.productImage;
                product.productDescription          = data.productDescription;


                if (err) {
                    return callback(err, null);
                }
                if (product) {
                    //_.merge(user, req.body);

                    product.save(function (err, product) {
                        if (err) {
                            res.json({data:err});
                        }

                        res.json({data:product});
                    });
                }
                else {
                    res.json({data:400});
                }
            });
        });

    };


    var searchProduct = function (req, res) {

        var productName = req.body.productTitle;

        mongoose.connect(url, function (err, product) {

            Product.find({productTitle: { "$regex": productName, "$options": "i" }}, function (err, product) {

                if(product){

                    res.json({code:200, product: product});

                }

            });


        });

    };

    var changeProductorName = function (req, callback) {

        var userInfo = req;

        mongoose.connect(url, function (err, product) {

            Product.find({productorID: userInfo.userID }, function (err, productResult) {

                if(productResult){

                    async.forEachOf(productResult, function (information, callback) {
                        Product.findById(information._id, function (err, productCallback) {

                            productCallback.productorName                = userInfo.userName;

                            if (err) {
                                return callback(err, null);
                            }
                            if (productCallback) {
                                //_.merge(user, req.body);

                                productCallback.save(function (err, product) {
                                    if (err) {
                                    }

                                });
                            }
                            else {
                                console.log(400);
                            }

                        });
                    }, function (err) {
                        if (err) {
                            return next(err);
                        } else {

                            return callback (null, 200);

                        }
                    });

                }
            });
        });
    };


    var deleteProduct = function(req,res) {
        var id = req.body.productID;

        mongoose.connect(url, function (err, product) {

            Product.findByIdAndRemove(id, function (err) {
                if (err) {

                    res.json({info: "error during remove product", error: err});
                }
                res.json({info: "Product removed successfully"});
                mongoose.disconnect();
            });
        });
    };


    var fnGetAllProductsByUserId = function (req,callback){
        var productorID = req;
        mongoose.connect(url, function (err, product) {
            Product.find({productorID: productorID}).sort({creationData: 'desc'}).exec(function (err,product) {
                var cbProduct = product;
                if(err){

                    return callback(err, null);
                }else {

                    return  callback(null, cbProduct);
                }

            });
        });
    };



    return{

        newproduct              : newproduct,
        updateProduct           : updateProduct,
        getAllProducts          : getAllProducts,
        getAllProductsByUserId  : getAllProductsByUserId,
        getAllProductsByCategory: getAllProductsByCategory,
        fnGetAllProductsByUserId: fnGetAllProductsByUserId,
        updateProduct           : updateProduct,
        getUpdateProduct        : getUpdateProduct,
        searchProduct           : searchProduct,
        changeProductorName     : changeProductorName,
        deleteProduct           : deleteProduct
    };


};

module.exports = productController;