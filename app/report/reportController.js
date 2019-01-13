const doUntil = require('async/doUntil');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var reportController = function (app) {

    const getReports = function(req,res) {

        const sql = "SELECT reports.id, reports.title, reports.text FROM reports";

        req.connection.query(sql, (err, result) => {

            if (err) {

                return res.json(err);

            } else{

                res.json({reportList: result});

            }

        });

    };

    const reportPost = function(req, res) {

        let tokenInformation = jwt.verify(req.body.token,'projectHFX');

        const reportPost = {
            reporter_user_id: tokenInformation._id,
            reported_post_id: req.body.reported_post_id,
            report_id: req.body.report_id,
            comment: req.body.comment
        }

        console.log(reportPost);

        const sql = "INSERT INTO post_reports (reporter_user_id, reported_post_id, report_id, comment, report_date) " +  
                    " VALUES (?, ?, ?, ?, NOW())";

        req.connection.query(sql,[reportPost.reporter_user_id,
                                  reportPost.reported_post_id,
                                  reportPost.report_id,
                                  reportPost.comment], (err, reportResult) => {

            if(err) {
                console.log(err);
                res.json(err);
            } else {
                console.log(reportResult);
                res.json({code: 200});
            }

        });

        

    }

    const reportUser = function(req, res) {

        let tokenInformation = jwt.verify(req.body.token,'projectHFX');

        const reportPost = {
            reporter_user_id: tokenInformation._id,
            reported_user_id: req.body.reported_user_id,
            report_id: req.body.report_id,
            comment: req.body.comment
        }

        console.log(reportPost);

        const sql = "INSERT INTO user_reports (reporter_user_id, reported_user_id, report_id, comment, report_date) " +  
                    " VALUES (?, ?, ?, ?, NOW())";

        req.connection.query(sql,[reportPost.reporter_user_id,
                                  reportPost.reported_post_id,
                                  reportPost.report_id,
                                  reportPost.comment], (err, reportResult) => {

            if(err) {
                console.log(err);
                res.json(err);
            } else {
                console.log(reportResult);
                res.json({code: 200});
            }

        });

        

    }

    const reportComment = function(req, res) {

        let tokenInformation = jwt.verify(req.body.token,'projectHFX');

        const reportComment = {
            reporter_user_id: tokenInformation._id,
            reported_comment_id: req.body.reported_comment_id,
            report_id: req.body.report_id,
            comment: req.body.comment
        }

        console.log(reportPost);

        const sql = "INSERT INTO comment_reports (reporter_user_id, reported_comment_id, report_id, comment, report_date) " +  
                    " VALUES (?, ?, ?, ?, NOW())";

        req.connection.query(sql,[reportComment.reporter_user_id,
                                  reportComment.reported_comment_id,
                                  reportComment.report_id,
                                  reportComment.comment], (err, reportResult) => {

            if(err) {
                console.log(err);
                res.json(err);
            } else {
                console.log(reportResult);
                res.json({code: 200});
            }

        });

        

    }

    return{
        getReports: getReports,
        reportPost: reportPost,
        reportComment: reportComment,
        reportUser: reportUser        
    };


};

module.exports = reportController;