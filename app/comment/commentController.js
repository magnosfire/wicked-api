const doUntil = require('async/doUntil');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var commentController = function (app) {

    var newcomment = function (req,res) {


        let tokenInformation = jwt.verify(req.body.token,'projectHFX');

        const commentData = {
            post_id: req.body.post_id,
            user_id: tokenInformation._id,
            parent_comment_id: req.body.comment_id || null,
            edit: false,
            user_IP: req.body.user_IP || null,
            text: req.body.comment
        };

        const sql = "INSERT INTO comments (post_id, user_id, parent_comment_id, comment_date, edit, user_IP, text) " +  
                    " VALUES (?, ?, ?, NOW(), ?, ?, ?)";

        req.connection.query(sql,[commentData.post_id,commentData.user_id,commentData.parent_comment_id,
                                  commentData.edit,commentData.user_IP,commentData.text], (err, result) => {

            if (err) {

                console.log(err);

                return res.json(err);

            } else{

                console.log(result.insertId);

                const selectSQL = " SELECT " + 
                                " comments.id, users.username, IF(comments.user_id = ?, 1,0) AS comment_owner, comments.text, comments.comment_date, " + 
                                " comments.edit, comments.edit_date, IF(replies.id IS NOT NULL, COUNT(comments.id), 0) as comments FROM comments AS comments " +
                                " LEFT JOIN (SELECT distinct * FROM comments WHERE parent_comment_id IS NOT NULL) AS replies " +
                                " ON replies.parent_comment_id = comments.id "+ 
                                " INNER JOIN users " +
                                " ON comments.user_id = users.id " + 
                                " WHERE comments.id = ? "+ 
                                " GROUP BY comments.id " + 
                                " ORDER BY comment_date ASC ";

                req.connection.query(selectSQL,[commentData.user_id, result.insertId], (err, resultSelect) => {

                    if (err) {
        
                        console.log(err);
        
                        return res.json(err);
        
                    } else{
        
                        console.log(resultSelect);
        
                        res.json({code:200, comment: resultSelect[0]});
        
                    }
        
                });

                

            }

        });




    };

    const getComments = function(req,res) {

        const postId = req.params.postId;

        let tokenInformation = jwt.verify(req.params.token,'projectHFX');

        const sql = " SELECT " + 
                    " comments.id, users.username, IF(comments.user_id = ?, 1,0) AS comment_owner, comments.text, comments.comment_date, " + 
                    " comments.edit, comments.edit_date, IF(replies.id IS NOT NULL, COUNT(comments.id), 0) as comments FROM comments AS comments " +
                    " INNER JOIN users " +
                    " ON comments.user_id = users.id " + 
                    " LEFT JOIN (SELECT distinct * FROM comments WHERE parent_comment_id IS NOT NULL) AS replies " +
                    " ON replies.parent_comment_id = comments.id "+ 
                    " WHERE comments.parent_comment_id IS NULL AND comments.post_id = ? "+ 
                    " GROUP BY comments.id " + 
                    " ORDER BY comment_date ASC ";

        req.connection.query(sql,[tokenInformation._id, postId], (err, result) => {

            if (err) {

                console.log(err);

                return res.json(err);

            } else{

                console.log(result);

                res.json({commentList: result});

            }

        });

    }

    const getReplies = function(req,res) {

        const commentId = req.params.commentId;

        let tokenInformation = jwt.verify(req.params.token,'projectHFX');

        const sql = " SELECT " + 
                    " comments.id, users.username, IF(comments.user_id = ?, 1,0) AS comment_owner, comments.text, comments.comment_date, " + 
                    " comments.edit, comments.edit_date FROM comments " +
                    " INNER JOIN users " +
                    " ON comments.user_id = users.id " +
                    " WHERE comments.parent_comment_id = ? "+ 
                    " GROUP BY comments.id " + 
                    " ORDER BY comment_date ASC ";

        req.connection.query(sql,[tokenInformation._id, commentId], (err, result) => {

            if (err) {

                console.log(err);

                return res.json(err);

            } else{

                res.json({commentList: result});

            }

        });

    }

     const updateComment = function(req,res) {

        updateInformation = {
            text: req.body.text,
            id : req.body.comment_id
        }

        const sql = "UPDATE comments SET text = ?, edit = true, edit_date = NOW() WHERE id = ? ";

        req.connection.query(sql,[updateInformation.text, updateInformation.id], (err, updateResult) => {

            if (err) {

                return res.json(err);

            } else{

                const sqlSelectUpdatedPost = "SELECT " + 
                                             " comments.id, comments.post_id, comments.user_id, comments.text, comments.comment_date, comments.edit, comments.edit_date " + 
                                             " FROM comments WHERE comments.id = ? "

                req.connection.query(sqlSelectUpdatedPost,[updateInformation.id], (err, selectPostResult) => {
                    if (err) {

                        return res.json(err);
        
                    } else{

                        res.json({code:200, comment: selectPostResult[0]});
                    }

                });

            }

        });

    }

    return{
        newcomment : newcomment,
        getComments: getComments,
        updateComment: updateComment,
        getReplies: getReplies
    };


};

module.exports = commentController;