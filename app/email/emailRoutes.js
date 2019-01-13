var express = require("express");
var emailRouter = express.Router();
var emailController = require("./emailController")();

var router = function () {

    emailRouter.route("/passwordfail")
        .post(emailController.sendEmailPasswordFail);


    return emailRouter;
};

module.exports = router;
