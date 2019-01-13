const doUntil = require('async/doUntil');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
const AWS = require('aws-sdk');
var multer  = require('multer');
var upload = multer();

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------

var api = require('sendwithus')('live_0670d5b00aff03edfeafbc7a555ff08b92befddc', debug=true);
const BUCKET_NAME = 'projecthfx';
const IAM_USER_KEY = 'AKIAIEFCAPXPIB4ZRVNQ';
const IAM_USER_SECRET = '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';


var postController = function (app) {

    var newpost = function (req,res) {

        console.log(req.body);

        let tokenInformation = jwt.verify(req.body.token,'projectHFX');


        const postData = {
            club_id: req.body.club_id,
            user_id: tokenInformation._id,
            edit: false,
            user_IP: null,
            text: req.body.text,
            picture: req.body.picture,
            pictureName: req.body.pictureName
        };

        console.log(postData);

        const BUCKET_NAME = 'projecthfx';
        const IAM_USER_KEY = 'AKIAIEFCAPXPIB4ZRVNQ';
        const IAM_USER_SECRET = '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';


        let s3bucket = new AWS.S3({
            accessKeyId: 'AKIAIEFCAPXPIB4ZRVNQ',
            secretAccessKey: 'YXgs5lphDMist5t2LA/1tCh6GGgzK1nhSGj1uwOh',
            Bucket: 'projecthfx',
            folder: 'wicked'
        });

        buf = new Buffer(postData.picture.replace(/^data:image\/\w+;base64,/, ""),'base64')


        s3bucket.createBucket(function () {

            var params = {
                Bucket: BUCKET_NAME,
                Key: postData.pictureName,
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            };

            s3bucket.upload(params, function (err, data) {

                if (err) {

                    console.log('error in callback');
                    console.log(err);

                } else {

                    console.log('success');
                    pictureS3URL = data.Location;
                    console.log(pictureS3URL);

                   /* req.connection.query('UPDATE users SET city_id = ?, completed = ?, image = ? WHERE id = ?',
                        [clubInformation.city_id, clubInformation.completed, pictureS3URL, clubInformation.user_id] , function (err, userResult) {

                        if (err) {

                            res.json({code:400});


                        } else {

                            res.json({code:200});

                        }

                    });*/

                    res.json({code:200});

                }
                
            });
        });

        

        /*const sql = "INSERT INTO posts (club_id, user_id, post_date, edit, user_IP, text) VALUES (?, ?, NOW(), ?, ?, ?)";

        req.connection.query(sql,[postData.club_id,postData.user_id,postData.edit,postData.user_IP,postData.text], (err, result) => {

            if (err) {

                return res.json(err);

            } else{

                post = result;

                getPostInfo(req, result.insertId, function(err, newPostInformation) {
                    res.json({post:newPostInformation});
                });


                //res.json({code:200});

            }

        });*/




    };

    const getPosts = function(req,res) {

        const clubName = req.params.clubName;
        const pagination = parseInt(req.params.pagination);

        console.log(clubName);

        const sql = "SELECT " + 
                        "posts.id, users.username, posts.post_date, posts.edit, posts.edit_date, posts.text, users.image, posts.pinned,  " + 
                        "IF(posts.user_id = 2, 1, 0) AS post_owner, " + 
                        "(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.parent_comment_id IS NULL) AS comments" +
                    " FROM posts"+ 
                    " INNER JOIN users ON posts.user_id = users.id"+ 
                    " WHERE club_id = (SELECT clubs.id FROM clubs WHERE club_name = ?)  ORDER BY pinned DESC, post_date  DESC LIMIT ? ,5";

        req.connection.query(sql,[clubName,pagination], (err, result) => {

            if (err) {


                return res.json(err);

            } else{
                
                console.log(result);

                res.json({postList: result});

            }

        });

    };

    const updatePost = function(req, res) {

        console.log(req.body);

        updateInformation = {
            text: req.body.text,
            id : req.body.post_id
        }

        const sql = "UPDATE posts SET text = ?, edit = true, edit_date = NOW() WHERE id = ? ";

        req.connection.query(sql,[updateInformation.text, updateInformation.id], (err, updateResult) => {

            if (err) {

                return res.json(err);

            } else{

                const sqlSelectUpdatedPost = "SELECT " + 
                                             " posts.id, posts.club_id, posts.user_id, posts.text, posts.post_date, posts.edit, posts.edit_date " + 
                                             " FROM posts WHERE posts.id = ? "

                req.connection.query(sqlSelectUpdatedPost,[updateInformation.id], (err, selectPostResult) => {
                    if (err) {

                        return res.json(err);
        
                    } else{
                        res.json({code:200, post: selectPostResult[0]});
                    }

                });

            }

        });

    }

    const pinAPost = function(req, res) {

        updateInformation = {
            post_id: req.body.post_id,
            club_id: req.body.club_id
        }

        const sql = "UPDATE posts SET pinned = 0 WHERE pinned = 1 AND club_id = ? ";

        req.connection.query(sql,[updateInformation.club_id], (err, updateResult) => {

            if (err) {

                return res.json(err);

            } else{

                const sql = "UPDATE posts SET pinned = 1 WHERE id = ? ";

                req.connection.query(sql,[updateInformation.post_id], (err, updateResult) => {

                    if (err) {

                        return res.json(err);
        
                    } else{
                        res.json({code:200});
                    }
                });
                
            }

        });

    }

    const removePin = function(req, res) {

        removeInformation = {
            post_id: req.body.post_id,
            club_id: req.body.club_id
        }

        console.log(removeInformation);

        const sql = "UPDATE posts SET pinned = 0 WHERE id = ? ";

        req.connection.query(sql,[removeInformation.post_id], (err, removePinResult) => {

            if (err) {

                console.log(err);

                return res.json(err);

            } else{

                res.json({code:200});
                
            }

        });

    }


    //-------------------------------------//

    getPostInfo = function(req, postID, callback) {

        const sql = "SELECT " + 
                        "posts.id, users.username, posts.post_date, posts.edit, posts.edit_date, posts.text, users.image," + 
                        "(SELECT COUNT(*) FROM comments WHERE comments.post_id = ? AND comments.parent_comment_id IS NULL) AS comments" +
                    " FROM posts"+ 
                    " INNER JOIN users ON posts.user_id = users.id"+ 
                    " WHERE posts.id = ?";

        req.connection.query(sql,[postID, postID], (err, result) => {

            if (err) {

                return callback(err, null);

            } else{

                return callback(null, result);

            }

        });
        
    };

    function uploadToS3(file) {
        let s3bucket = new AWS.S3({
          accessKeyId: IAM_USER_KEY,
          secretAccessKey: IAM_USER_SECRET,
          Bucket: BUCKET_NAME,
        });
        s3bucket.createBucket(function () {
          var params = {
           Bucket: BUCKET_NAME,
           Key: file.name,
           Body: file.data,
          };
          s3bucket.upload(params, function (err, data) {
           if (err) {
            console.log('error in callback');
            console.log(err);
           }
           console.log('success');
           console.log(data);
          });
        });
       }

    //-------------------------------------//

    return{
        newpost : newpost,
        getPosts: getPosts,
        updatePost: updatePost,
        pinAPost: pinAPost,
        removePin: removePin
    };


};

module.exports = postController;