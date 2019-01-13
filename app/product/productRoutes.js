var express = require("express");

var productRouter = express.Router();

var productController = require("./productController")();

var router = function () {

    productRouter.route("/newproduct")
        .post(productController.newproduct);

    productRouter.route("/getAllProducts")
        .post(productController.getAllProducts);

    productRouter.route("/getAllProductsByUserId")
        .post(productController.getAllProductsByUserId);

    productRouter.route("/getAllProductsByCategory")
        .post(productController.getAllProductsByCategory);

    productRouter.route("/getUpdateProduct")
        .post(productController.getUpdateProduct);

    productRouter.route("/updateProduct")
        .post(productController.updateProduct);

    productRouter.route("/searchProduct")
        .post(productController.searchProduct);

    productRouter.route("/deleteProduct")
        .post(productController.deleteProduct);


    return productRouter;
};

module.exports = router;
