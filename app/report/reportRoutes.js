var express = require("express");
var reportRouter = express.Router();
var reportontroller = require("./reportController")();

var router = function () {
    
    reportRouter.route("/")
        .get(reportontroller.getReports);

    reportRouter.route("/reportPost")
        .post(reportontroller.reportPost);

    reportRouter.route("/reportUser")
        .post(reportontroller.reportUser);

    reportRouter.route("/reportComment")
        .post(reportontroller.reportComment);

    return reportRouter;
};

module.exports = router;
