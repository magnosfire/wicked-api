const mongoose = require("mongoose");
const async = require("async");
const doUntil = require('async/doUntil');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt   = require('bcrypt-nodejs');
const moment   = require('moment');
const AWS = require('aws-sdk');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var multer  = require('multer');
var upload = multer();

//---------------MODELS--------------------------
const User = require("./userModel");
//------------END--MODELS------------------------

//---------------CONTROLLERS-----------------------
const configController = require("../configuration/configController")();
const productController = require("../product/productController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
const url = configController.dbUrl();
//------------END--VARIABLES----------------------

var api = require('sendwithus')('live_0670d5b00aff03edfeafbc7a555ff08b92befddc', debug=true);
const BUCKET_NAME = 'projecthfx';
const IAM_USER_KEY = 'AKIAIEFCAPXPIB4ZRVNQ';
const IAM_USER_SECRET = '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';


const userController = function (app) {

    registerUser = function (req,res,next) {

        const hash = bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(8), null);

        const user = {
            username : req.body.username,
            email : req.body.email,
            password: hash,
            gender_id: parseInt(req.body.gender) + parseInt(req.body.sexOrientation),
            birthdate: req.body.birthdate,
            partner_birthdate: req.body.partnerBirthdate || null,
            terms: req.body.terms,
            completed: false,
            email_confirmed: false
        };

        console.log(req.body);

        req.connection.query('INSERT INTO users SET ?',user, (err, result) => {

            if (err) {

                console.log(err);

                return next(err);

            } else{

                setPrivacy(req,result.insertId, function(err, result){
                    if(result) {
                        
                        const payload = {
                            username: user.username,
                            email: user.email,
                            _id: result.insertId
                        };
                        const token = jwt.sign(payload, 'projectHFX', {
                            expiresIn: 86400 // expires in 24 hours
                        });
        
                        res.json({code: 200, token: token, user: {
                                city: result.city_id,
                                gender: result.gender_id,
                                completed: result.completed,
                                emailConfirmed: result.email_confirmed
                        }});

                    }
                    else {
                        res.json({code:400});
                    }
                });

                


            }

        });

    };

    login = function (req, res, next) {

        const username      = req.body.username;
        const email         = req.body.email;
        console.log('req.body');
        console.log(req.body);
        console.log('req.body');

        req.connection.query('SELECT users.id as id, users.username, users.city_id, users.password, users.email, users.gender_id,'+ 
                             ' users.birthdate, users.partner_birthdate, users.completed, users.email_confirmed, users.image ' + 
                             ' FROM users WHERE users.username = ? OR users.email = ?', [username, email], function (err, userResult) {
            if (err) {
                console.log(err);
                res.json({err:err});
            } else {

                const result = userResult[0];
                
                if (result) {

                    if (bcrypt.compareSync(req.body.password, result.password)) {

                        const loginInformation = {
                            userIP: req.body.userIP,
                            user_id: result.id,
                            login_date: moment().format('YYYY-MM-DD HH:mm:ss')
                        }

                        saveLoginInformation(req, loginInformation);

                        const payload = {
                            username: result.username,
                            email: result.email,
                            _id: result.id
                        };
                        const token = jwt.sign(payload, 'projectHFX', {
                            expiresIn: 86400 // expires in 24 hours
                        });

                        res.json({token: token,
                                 code:200,
                                 user: {
                                    city_id: result.city_id,
                                    gender_id: result.gender_id,
                                    completed: result.completed,
                                    email_confirmed: result.email_confirmed,
                                    birthdate: result.birthdate,
                                    partner_birthdate: result.partner_birthdate
                                }
                        }
                        );


                    } else {

                        console.log('Invalid password');

                        res.json({code: 400, message: "Invalid password"});


                    }

                } else {

                    res.json({code: 500, message: "User not found."});
                }
            }
        });
    };

    usernameSuggestion = function (req,res,next) {

        let username      = req.params.username;
        let email         = req.params.email;

        let result = false;
        let counter = 0 ;

        checkEmailIsAvaliable(req, email, function (err, emailResult) {



            if(emailResult.emailIsAvaliable === false){
                res.json( {email:{
                                emailIsAvailable: false,
                                message: 'email is already taken'}});
            } else {

                async.whilst(
                    function () { return result !== true; },
                    function (callback) {
                        checkValidUserName(req,username, function (err, usernameCallback) {
                            if(usernameCallback.username.isValid === false){
                                username = username+counter;
                                counter = counter + 1;
                                callback(null,username);
                            } else {
                                result = true;
                                callback(null,username);
                            }
                        });

                    },
                    function (err, username) {
                        res.json({email:{
                                        emailIsAvailable: true,
                                        message: 'email is free to use'},
                                 username: {
                                        suggestion: username
                                            }
                                });
                    }
                );
            }

        });

    };

    checkUsernameAvailability = function (req,res) {

        let username      = req.params.username;

        checkValidUserName(req,username, function (err, usernameCallback) {

            if( usernameCallback.username.isValid ) {
                res.json({isValid:true});
            } else {
                res.json({isValid: false});
            }

        });

    };

    registerStepTwoUser = function (req, res) {

        let tokenInformation = jwt.verify(req.body.token,'projectHFX');
        let pictureS3URL;

        clubInformation = {

            user_id: tokenInformation._id,
            picture: req.body.picture,
            pictureName: req.body.pictureName,
            city_id: req.body.city,
            completed: true

        };
        
        const BUCKET_NAME = 'projecthfx';
        const IAM_USER_KEY = 'AKIAIEFCAPXPIB4ZRVNQ';
        const IAM_USER_SECRET = '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';


        let s3bucket = new AWS.S3({
            accessKeyId: 'AKIAIEFCAPXPIB4ZRVNQ',
            secretAccessKey: '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',
            Bucket: 'projecthfx',
            folder: 'wicked'
        });

        buf = new Buffer(clubInformation.picture.replace(/^data:image\/\w+;base64,/, ""),'base64')


        s3bucket.createBucket(function () {

            var params = {
                Bucket: BUCKET_NAME,
                Key: clubInformation.pictureName,
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

                    req.connection.query('UPDATE users SET city_id = ?, completed = ?, image = ? WHERE id = ?',
                        [clubInformation.city_id, clubInformation.completed, pictureS3URL, clubInformation.user_id] , function (err, userResult) {

                        if (err) {

                            res.json({code:400});


                        } else {

                            res.json({code:200});

                        }

                    });

                }
                
            });
        });

    };

    passwordReset = function (req, res) {
    
        const username  = req.body.username;
        const email     = req.body.email;

        req.connection.query('SELECT users.email as email, users.username as username, users.id as user_id FROM users WHERE users.username = ? OR users.email = ?', [username, email], function (err, userResult) {

            if (err) {
                handleError(res, err, 500)
            } else {

                const result = userResult[0];

                if(result) {

                    let resetPasswordCode = Math.random().toString(36).slice(-8)
                    const payload = {
                        resetPasswordCode: resetPasswordCode
                    };
                    const hashResetPasswordCode = jwt.sign(payload, 'projectHFX', {
                        expiresIn: 10800 // expires in 3 hours
                    });

                    req.connection.query('INSERT INTO reset_password (user_id, request_date, request_code, used) VALUES (?, NOW(), ?, 0)', [result.user_id, resetPasswordCode], function (err, passwordResponse) {
                    
                        console.log(err);
                        
                        const emailInformation = {
                            email: result.email,
                            username: result.username,
                            hashResetPasswordCode: hashResetPasswordCode
                        }
                        
                        sendPasswordResetEmail(emailInformation, function(err, emailResponse){
                            res.json({code: 200, hash: hashResetPasswordCode});
                        });
                        

                    });

                } else {
                    res.json({code: 400});

                }
                
                
            }
        });

    };

    newPassword = function (req, res) {
    
        const hashResetPasswordCode       = req.body.resetCode;
        const newPassword     = bcrypt.hashSync(req.body.newPassword,bcrypt.genSaltSync(8), null);

        jwt.verify(hashResetPasswordCode,'projectHFX', function(err, tokenInformation) {
            
            if(err) {
                res.json({code: 400})
            }

            const resetPasswordCode = tokenInformation.resetPasswordCode;

            req.connection.query('UPDATE users SET users.password = ? ' +
                             ' WHERE users.id = ' + 
                             '(SELECT reset_password.user_id FROM reset_password WHERE reset_password.request_code = ? AND reset_password.used = 0);',
                             [newPassword, resetPasswordCode], function(err, newPasswordResponse) {
                                 
            if (err) {

                res.json({code: 500});
                
            } else {

                if(newPasswordResponse.changedRows === 0) {

                    res.json({code: 204});
                } else {


                    setResetPasswordLinkAsUsed(req, resetPasswordCode)

                    res.json({code: 200});
                }

                
            }

        });

        });
    
    };

    getBasicGenders = function (req,res) {

        req.connection.query('SELECT genders.id as id, genders.gender_title as gender FROM genders WHERE genders.id <= 6', function (err, gendersResult) {
            if (err) {
            } else {
                const result = gendersResult;
                if (result) {
                    res.json({code:200, basicGenders: result});
                } else {
                    res.json({code: 400});
                }
            }
        });

    };

    getSexOrientation = function(req, res) {

        const sexOrientation = req.params.sexOrientationId;
        let sql = '';

        if(sexOrientation <= 3 ) {
            sql = 'SELECT genders.id as id, genders.gender_title as gender FROM genders WHERE genders.id = 10 OR genders.id = 20 OR genders.id = 30';
        }
        if(sexOrientation >= 4 && sexOrientation <=5 ) {
            sql = 'SELECT genders.id as id, genders.gender_title as gender FROM genders WHERE genders.id = 20 OR genders.id = 30';
        }

        req.connection.query(sql, function (err, sexOrientationResult) {
            if (err) {
            } else {
                const result = sexOrientationResult;
                if (result) {
                    res.json({code:200, sexOrientation: result});
                } else {
                    res.json({code: 400});
                }
            }
        });

    }

    getGendersAndSexOrientation = function (req,res) {

        req.connection.query('SELECT genders.id as id, genders.gender_title as gender FROM genders WHERE '+
                             'genders.id = 6 OR (genders.id >= 11 AND genders.id <= 19) '+
                             'OR (genders.id >= 21 AND genders.id <= 29) '+
                             'OR (genders.id >= 31 AND genders.id <= 39) '+
                             'ORDER BY genders.gender_title ASC;', function (err, gendersResult) {
            if (err) {
            } else {
                const result = gendersResult;
                if (result) {
                    res.json({code:200, gendersAndSexOrientation: result});
                } else {
                    res.json({code: 400});
                }
            }
        });

    };

    tokenValidation = function(req,res) {

        const token = req.body.token;

        jwt.verify(token.token,'projectHFX', function(err, tokenInformation) {
            console.log(tokenInformation);
            if(err) {
                console.log(err);
                res.json({validation:false});
            } else {
                console.log(tokenInformation);
                res.json({validation:true});
            }
        });
    }

    getProfileInformation = function (req,res) {

        const username = req.body.username || '';
        const userInformation  = getTokenInformation(req.body.token) ;
        let sql;
        let params;

        

        

        if(username) { 

            sql =   " SELECT users.id, users.username, users.bio, genders.gender_title AS gender, users.birthdate AS age, cities.name AS city , " + 
                    " regions.name AS region, users.image, gender_interest.gender_title AS gender_interest, users.partner_birthdate AS partner_age, " + 
                    " privacy.show_clubs, privacy.show_gallery, privacy.show_logged, " + 
                    " IF(users.id = ?, 1, 0) AS own_profile, logins.last_login  FROM users " +
                    " INNER JOIN user_privacy AS privacy ON privacy.user_id = users.id " +
                    " INNER JOIN genders AS genders ON genders.id = users.gender_id " + 
                    " INNER JOIN genders AS gender_interest ON gender_interest.id = users.gender_interest_id " + 
                    " INNER JOIN (SELECT MAX(logins.login_date) AS last_login, logins.user_id FROM logins " + 
                    " INNER JOIN users ON users.id = logins.user_id WHERE users.username = ? ) AS logins ON logins.user_id = users.id " +
                    " INNER JOIN cities ON cities.id = users.city_id " + 
                    " INNER JOIN regions ON regions.id = cities.region_id " + 
                    " WHERE users.username = ? "

            params = [userInformation._id, username, username]


        } else {

            sql =   " SELECT users.id, users.username, users.bio, genders.gender_title AS gender, users.birthdate AS age, cities.name AS city , " + 
                    " regions.name AS region, users.image, gender_interest.gender_title AS gender_interest, users.partner_birthdate AS partner_age, " + 
                    " privacy.show_clubs, privacy.show_gallery, privacy.show_logged, " + 
                    " IF(users.id = ?, 1, 0) AS own_profile, logins.last_login  FROM users " +
                    " INNER JOIN user_privacy AS privacy ON privacy.user_id = users.id " +
                    " INNER JOIN genders AS genders ON genders.id = users.gender_id " + 
                    " INNER JOIN genders AS gender_interest ON gender_interest.id = users.gender_interest_id " + 
                    " INNER JOIN (SELECT MAX(logins.login_date) AS last_login, logins.user_id FROM logins WHERE logins.user_id = ?) AS logins ON logins.user_id = users.id " +
                    " INNER JOIN cities ON cities.id = users.city_id " + 
                    " INNER JOIN regions ON regions.id = cities.region_id " + 
                    " WHERE users.id = ? "

            params = [userInformation._id, userInformation._id, userInformation._id]


        }

        

        req.connection.query(sql,params,function (err, profileResult) {
            if (err) {

                console.log(err);

            } else {

                const profileInformation = profileResult;

                console.log(profileInformation);

                //save the visit to the user profile if this profile is not the own user profile
                if(profileInformation[0].own_profile === 0 ) {

                    const visitSql = "INSERT INTO profile_visits (visitor_id, profile_user_id, visit_date) " + 
                                     "VALUES (?, ?, NOW())";

                    const visitInformation = {
                        visitor_id: userInformation._id,
                        profile_user_id: profileInformation[0].id
                    }

                    req.connection.query(visitSql,[visitInformation.visitor_id,visitInformation.profile_user_id],function (err, visitResult) {
                        if (err) {
            
                            console.log(err);
            
                        } 
                    });
                
                }

                if (profileInformation) {
                    res.json({code:200, profileInformation: profileInformation[0]});
                } else {
                    res.json({code: 400});
                }
                

            }
        });

    };

    getPrivacy = function(req, res) {

        const token = req.params.token;

        const userInformation = getTokenInformation(token);

        const sql = "SELECT user_privacy.id, user_privacy.user_id, user_privacy.show_clubs, user_privacy.show_gallery, user_privacy.show_logged " + 
                    " FROM user_privacy WHERE user_id = ?";


        req.connection.query(sql,userInformation._id , function (err, privacyListResult) {
            if (err) {
                res.json({code: 400});
            } else {

                res.json({code:200, privacyList: privacyListResult[0]});

            }
        });

    }

    updatePrivacy =    function(req, res) {

        console.log(req.body);

        updatePrivacyInformation = {
            show_clubs : req.body.show_clubs,
            show_gallery: req.body.show_gallery,
            show_logged: req.body.show_logged,
            user_id: req.body.user_id
        }

        const sql = "UPDATE user_privacy SET show_clubs = ?, show_gallery = ?, show_logged = ? WHERE user_id = ? ";

        req.connection.query(sql,[updatePrivacyInformation.show_clubs,updatePrivacyInformation.show_gallery,
                                  updatePrivacyInformation.show_logged,updatePrivacyInformation.user_id,], (err, updateResult) => {

            if (err) {

                return res.json(err);

            } else{

                res.json({code:200});

            }

        });

    }

    changePassword = function(req, res) {

        console.log(req.body);

        const userInformation = getTokenInformation(req.body.token);
        const newPassword     = bcrypt.hashSync(req.body.new_password,bcrypt.genSaltSync(8), null);

        const currentPassword     = bcrypt.hashSync(req.body.current_password,bcrypt.genSaltSync(8), null);

        req.connection.query(' SELECT users.password FROM users ' +
                             ' WHERE users.id = ?',
                             userInformation._id, function(err, currentPasswordResponse) {
                                 
            if (err) {

                console.log(err);

                res.json({code: 500});
                
            } else {

                const result = currentPasswordResponse[0];

                console.log(req.body.current_password);
                
                if (result) {

                    if (bcrypt.compareSync(req.body.current_password, result.password)) {

                        req.connection.query('UPDATE users SET users.password = ? ' +
                             ' WHERE users.id = ?',
                             [newPassword, userInformation._id], function(err, newPasswordResponse) {
                                 
                            if (err) {

                                res.json({code: 500});
                                
                            } else {

                                if(newPasswordResponse.changedRows === 0) {

                                    res.json({code: 204});

                                } else {

                                    res.json({code: 200});

                                }

                                
                            }

                        });

                    } else {

                        res.json({code:400});


                    }

                        

                }

                
            }

        });

        /**/



    }

    getPremiumInformation = function(req, res) {

        const userInformation = getTokenInformation(req.params.token);
        

        getPremium(req, userInformation._id, function(err, premiumInformation) {

            res.json({code: 200, data: premiumInformation});

        });


        

    }

    newPremium = function(req,res) {
        
        const userInformation = getTokenInformation(req.body.token);

        const sql = "INSERT INTO premiums (user_id, begin_date, end_date) " +  
                    " VALUES (?, NOW(), (NOW() + INTERVAL 30 DAY))";

        req.connection.query(sql, userInformation._id, function(err, premiumInformationResponse) { 


            if(err) {

                res.json({code:400})

            } else {

                const updateUserInformationSql = "UPDATE users SET users.premium_id = ? WHERE users.id = ?";

                req.connection.query(updateUserInformationSql, [premiumInformationResponse.insertId, userInformation._id], function(err, rebillResponse) {

                    if(err) {
                        res.json({code:400});
                    } else {
                        res.json({code: 200, data: premiumInformationResponse[0]});
                    }
        
                });
            }

        });

    }

    rebillPremium = function(req, res) {

        const userInformation = getTokenInformation(req.body.token);
        
        const rebillInformation = {

            rebill: req.body.rebill,
            user_id: userInformation._id

        };

        const sql = "UPDATE premiums SET premiums.auto_rebill = ? WHERE premiums.user_id = ?";


        req.connection.query(sql, [rebillInformation.rebill, rebillInformation.user_id], function(err, rebillResponse) {

            if(err) {
                res.json({code:400});
            } else {
                res.json({code:200, data: "Auto-rebill has changed"});
            }

        });
        
    }

    getGendersInterest = function (req,res) {

        const userInformation = getTokenInformation(req.params.token);
        req.connection.query('SELECT genders.id as id, genders.gender_title as gender,IF(user_genders.gender_id = genders.id, 1, 0) AS checked FROM genders '+
         'LEFT JOIN ( SELECT * FROM user_genders WHERE user_genders.user_id = ? ORDER BY user_genders.gender_id ASC) AS user_genders ON genders.id = user_genders.gender_id '+
          'WHERE '+
            'genders.id = 6 OR (genders.id >= 11 AND genders.id <= 19) '+
            'OR (genders.id >= 21 AND genders.id <= 29) '+
        'OR (genders.id >= 31 AND genders.id <= 39) '+
        'ORDER BY genders.gender_title ASC',[userInformation._id], function (err, gendersInterestResult) {
            if (err) {

            res.json({code:400});

            } else {

            const result = gendersInterestResult;

            res.json({code:400, gendersInterestList: gendersInterestResult});

            }
            });

    };

    profileUpdate = function(req, res) {

        const userInformation = getTokenInformation(req.body.token);

        const newProfileInformation = {

            edit_bio: req.body.edit_bio,
            countryID : req.body.country,
            provinceID: req.body.province,
            cityID: req.body.cityID,
            interest: req.body.interest

        }

        let userInterests = [];

        async.parallel([
            function(callback){
                
                async.waterfall([
                    //delete all user interests
                    function(callback) {

                        req.connection.query("DELETE FROM user_genders WHERE user_genders.user_id = 2",
                                [userInformation._id], (err, result) => {
                            if(err) {
                                
                                callback(err,null);

                            } else {

                                console.log(result);

                                callback(null,200);

                            }
                        });

                    },
                    //prepare and insert the new user interest
                    function(fnCallback, callback) {

                        //prepare the user intereset to insert into the database
                        async.waterfall([
                            function(callback) {

                                console.log(newProfileInformation.interest);
        
                                newProfileInformation.interest.forEach(element => {

                                    userInterests.push([userInformation._id, element]);
        
                                });
                                
                                if(userInterests.length === newProfileInformation.interest.length) {
        
                                    callback(null,userInterests);
        
                                }
        
        
                            },
                            //insert the user interest
                            function(fnCallback, callback) {

                                console.log(userInterests);
        
                                req.connection.query("INSERT INTO user_genders (user_genders.user_id, user_genders.gender_id) VALUES ?",
                                     [userInterests], (err, result) => {

                                    if(err) {

                                        callback(err,null);
                    
                                    } else {

                                        callback(null,err);

                                    }
                                                                        
                                });

                              
        
                            }
                        ], function (err,results){

                            callback(null, 200);
        
                        });

                    }
                ], function (err,results){

                    callback(null, 200);

                });

            },function(callback){
                
                req.connection.query("UPDATE users SET users.bio = ?, users.city_id = ? WHERE users.id = ?", 
                    [newProfileInformation.edit_bio, newProfileInformation.cityID, userInformation._id], (err, result) => {
                    if(err) {
                        
                        callback(err,null);

                    } else {
                        
                        callback(null,result);

                    }
                });

            }

        ], function(err, results) { 

            if(err) {
                res.json({code:400});
            } else {

                async.parallel([
                    function(callback){

                        sql =   " SELECT users.id, users.username, users.bio, genders.gender_title AS gender, users.birthdate AS age, cities.name AS city , " + 
                                " regions.name AS region, users.image, gender_interest.gender_title AS gender_interest, users.partner_birthdate AS partner_age, " + 
                                " privacy.show_clubs, privacy.show_gallery, privacy.show_logged, " + 
                                " IF(users.id = ?, 1, 0) AS own_profile, logins.last_login  FROM users " +
                                " INNER JOIN user_privacy AS privacy ON privacy.user_id = users.id " +
                                " INNER JOIN genders AS genders ON genders.id = users.gender_id " + 
                                " INNER JOIN genders AS gender_interest ON gender_interest.id = users.gender_interest_id " + 
                                " INNER JOIN (SELECT MAX(logins.login_date) AS last_login, logins.user_id FROM logins WHERE logins.user_id = ?) AS logins ON logins.user_id = users.id " +
                                " INNER JOIN cities ON cities.id = users.city_id " + 
                                " INNER JOIN regions ON regions.id = cities.region_id " + 
                                " WHERE users.id = ? "

                        params = [userInformation._id, userInformation._id, userInformation._id];

                        req.connection.query(sql,params,function (err, profileResult) {
                            if (err) {
                
                                callback(err,null);
                
                            } else {
                
                                const profileInformation = profileResult;
                
                                if (profileInformation) {
                                    callback(null,profileInformation[0]);
                                } else {
                                    callback(err, null);
                                }
                                
                
                            }
                        });

                    },function(callback){

                        sql =   " SELECT genders.gender_title FROM user_genders " +
                                " LEFT JOIN genders ON genders.id = user_genders.gender_id " +
                                " WHERE user_genders.user_id = ?; "

                        params = [userInformation._id];

                        req.connection.query(sql,params,function (err, interestResult) {
                            if (err) {
                
                                callback(err,null);
                
                            } else {

                                let interestString = '';
                                let counter = 0;
                
                                interestResult.forEach(element => {

                                    interestString = interestString + ', ' + element.gender_title;
                                    counter++;
        
                                });
                                
                                if(counter === newProfileInformation.interest.length) {
        
                                    callback(null,interestString);
        
                                }
                                
                            }
                        });

                    }
                
                ], function(err, results) {

                    console.log(results[0]);

                    if(err) {
                        res.json({code:400});
                    } else {
                        res.json({code:200, interestString: results[1],profileInformation: results[0]});
                    }


                });



                

            }

        });

    }


    /* ---- FUNCTIONS ------ */

    getTokenInformation = function(token) {
        return jwt.verify(token,'projectHFX');
    };

    setPrivacy = function(req, user_id, callback) {

        req.connection.query("INSERT INTO user_privacy (user_id, show_clubs, show_gallery, show_logged) " +  
        " VALUES (?, 1, 1, 1)", user_id, (err, result) => {

            if(err) { 
                callback(err,null);
            } else {
                callback(null, true)
            }

        });

    }

    checkValidUserName = function (req,username, callback) {

        req.connection.query('SELECT * FROM users WHERE username = ?', [username], function (err, userResult) {
            if (err) {
            } else {
                const result = userResult[0];
                if (result) {
                    return callback(null,{username: {isValid: false}});
                } else {
                    return callback(null,{username: {isValid: true, username: username}});
                }
            }
        });

    };

    checkEmailIsAvaliable = function (req, email, callback) {
        req.connection.query('SELECT * FROM users WHERE email = ?', [email], function (err, emailResult) {
            if (err) {
            } else {
                const result = emailResult[0];
                if (result) {
                    return callback(null,{emailIsAvaliable: false});
                } else {
                    return callback(null,{emailIsAvaliable: true,email: email});
                }
            }
        });
    };

    saveLoginInformation = function(req, loginInformation) {

        console.log(loginInformation);

        req.connection.query('INSERT INTO logins (user_id, user_ip, login_date) VALUES (?, ?, ?)',
                            [loginInformation.user_id, loginInformation.userIP,loginInformation.login_date], (err, result) => { 

            if (err) {
                console.log(err);
            } else{

            }

        });

    }

    sendPasswordResetEmail = function(emailInformation, callback) {

        /*api.send({
            template: 'tem_2cAXbShMqPRcj5UQkctFmK',
            recipient: {
                address: 'rossini.magnus@gmail.com',
                name: emailInformation.username
            },
            template_data: { username: emailInformation.username, resetCode: hashResetPasswordCode }
        }, callback);*/

        return callback(null,'test');

    };

    setResetPasswordLinkAsUsed = function(req, resetPasswordCode) {
        req.connection.query('UPDATE reset_password SET reset_password.used = 1 WHERE reset_password.request_code = ?', resetPasswordCode, function(err, response) {
                                 
            if (err) {
                
            } else {

            }
        });
    };

    getPremium = function(req,user_id, callback) {

        const sql = " SELECT users.id, premiums.id, premiums.begin_date, premiums.end_date, premiums.auto_rebill, IF(premiums.end_date > NOW(), 1, 0) is_premium FROM users " +
                    " LEFT JOIN premiums ON premiums.user_id = users.id " +
                    " WHERE users.id = ? ";

        req.connection.query(sql, user_id, function(err, premiumInformationResponse) { 

            if(err) {

            } else {
                callback(null,premiumInformationResponse[0]);
            }

        });

    }


    getGenders = function(req, callback) {

        

    }

    getUserInterest = function(req, user_id, callback) {

        req.connection.query('SELECT user_genders.user_id, user_genders.gender_id FROM user_genders where user_genders.user_id = ?', user_id, function (err, userInterestResult) {
            if (err) {

                callback(err,null);

            } else {
                
                const result = userInterestResult;

                callback(null,result);

            }
        });

    }

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

    return {

        registerUser : registerUser,
        login: login,
        usernameSuggestion: usernameSuggestion,
        checkUsernameAvailability: checkUsernameAvailability,
        registerStepTwoUser : registerStepTwoUser,
        passwordReset: passwordReset,
        getBasicGenders: getBasicGenders,
        newPassword: newPassword,
        tokenValidation: tokenValidation,
        getSexOrientation: getSexOrientation,
        getGendersAndSexOrientation: getGendersAndSexOrientation,
        getProfileInformation: getProfileInformation,
        getPrivacy: getPrivacy,
        updatePrivacy: updatePrivacy,
        changePassword: changePassword,
        getPremiumInformation: getPremiumInformation,
        newPremium: newPremium,
        rebillPremium: rebillPremium,
        getGendersInterest: getGendersInterest,
        profileUpdate: profileUpdate


    };


};

module.exports = userController;