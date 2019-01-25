const async = require("async");
const doUntil = require('async/doUntil');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

//---------------MODELS--------------------------
const Club = require("./clubModel");
//------------END--MODELS------------------------

//---------------CONTROLLERS-----------------------
const configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
const url = configController.dbUrl();
//------------END--VARIABLES----------------------


const clubController = function (app) {

    const newClub = function (req,res,next) {

        const token = req.body.token;
        let tokenInformation;

        jwt.verify(token.token,'projectHFX', function(err, resultTokenInformation) {
            tokenInformation = resultTokenInformation;
        });

        clubInformation = {
            club_name: req.body.clubname,
            user_id: tokenInformation._id,
            city_id: req.body.token.user.city_id,
            description: req.body.description,
            private: req.body.visibility,
            genders: req.body.genders,
            image: req.body.image || '',
            minAge: req.body.minAge || '',
            maxAge: req.body.maxAge || ''
        }

        const sql = "INSERT INTO clubs (user_id, city_id, club_name, description, private, image, creation_date, min_age, max_age) " + 
                    "VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)";

        req.connection.query(sql,[clubInformation.user_id, clubInformation.city_id, 
                                clubInformation.club_name, clubInformation.description, clubInformation.private, 
                                clubInformation.image, clubInformation.minAge, clubInformation.maxAge], (err, clubInsertionResult) => {

            if (err) {

                res.json({code:400, message:'Error in saving clubs', err:err});

            } else{
                arr = [];
                
                async.parallel([
                    function(callback){
                        
                        clubInformation.genders.forEach(element => {

                            arr.push([clubInsertionResult.insertId, element]);

                        });
                        
                        if(arr.length === clubInformation.genders.length) {

                            callback(null,arr);

                        }

                    }
                ], function(err, results) {

                    req.connection.query("INSERT INTO club_genders (club_genders.club_id, club_genders.gender_id) VALUES ?",
                                     [arr], (err, result) => {
                    if(err) {
                        
                        res.json({code:400, message:'Error in saving genders', err:err});

    
                    } else {
                        
                        res.json({code:200, message: "Club created with success"});

                    }
                    
                });


                });

            }

        });

    };

    const getClubs = function (req, res) {

        const token = JSON.parse(req.params.token);

        const tokenInformation = jwt.verify(token.token,'projectHFX');

        const birthdateToCheck = new Date(token.user.birthdate);

        let partner_birthdate;

        // Because of leap year sum plus 5
        birthdateToCheck.setDate( birthdateToCheck.getDate() + 5 );

        const timeDiff = Math.abs(Date.now() - (birthdateToCheck.getTime()) );

        const user_age = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);

        if(token.user.partner_birthdate) {

            // Because of leap year sum plus 5
            birthdateToCheck.setDate( token.user.partner_birthdate.getDate() + 5 );

            const timeDiff = Math.abs(Date.now() - (birthdateToCheck.getTime()) );

            partner_birthdate = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);


        } else {

            partner_birthdate = token.user.partner_birthdate;

        }
        

        

        const userData = {
            user_id: tokenInformation._id,
            city_id: token.user.city_id,
            gender_id: token.user.gender_id,
            user_age: user_age,
            partner_birthdate: partner_birthdate
        };

        async.parallel([
            function(callback) {

                getAllPublicClubsNotJoined(req, userData, function (err, notJoinedPublicClubList) {
                    callback(null,notJoinedPublicClubList);
                });
            },
            function(callback) {

                getAllJoinedClubs(req,userData, function (err, joinedClubsList) {
                    callback(null,joinedClubsList);
                });
            }
        ], function(err, results) {
            res.json({publicClubs: results[0], joinedClubs: results[1]});
        });

    };

    const getClubMembers = function(req,res) {

        const club_name = req.params.club_name;

        let admList = [];
        let modList = [];
        let memberList = [];

        async.parallel([
            function(callback) {

                req.connection.query('SELECT users.username,users.image,  club_members.user_id, club_members.member_role_id FROM projecthfx.club_members' +
                ' INNER JOIN users ON club_members.user_id = users.id ' +
                ' WHERE club_members.club_id = (SELECT clubs.id FROM clubs WHERE clubs.club_name = ?) AND club_members.member_role_id = 1', club_name , (err, admListResult) => {
                    if(err) {
                        
                        callback(err,null);

                    } else { 

                        admList = admListResult;
                        
                        callback(null,admListResult);

                    }
                });
                
            },
            function(callback) {

                req.connection.query('SELECT users.username,users.image,  club_members.user_id, club_members.member_role_id FROM projecthfx.club_members' +
                ' INNER JOIN users ON club_members.user_id = users.id ' +
                ' WHERE club_members.club_id = (SELECT clubs.id FROM clubs WHERE clubs.club_name = ?) AND club_members.member_role_id = 2', club_name , (err, modListResult) => {
                    if(err) {
                        
                        callback(err,null);

                    } else { 

                        modList = modListResult;
                        
                        callback(null,modListResult);

                    }
                });
                
            },function(callback) {

                req.connection.query('SELECT users.username,users.image,  club_members.user_id, club_members.member_role_id FROM projecthfx.club_members' +
                ' INNER JOIN users ON club_members.user_id = users.id ' +
                ' WHERE club_members.club_id = (SELECT clubs.id FROM clubs WHERE clubs.club_name = ?) AND club_members.member_role_id = 3', club_name , (err, memberListResult) => {
                    if(err) {
                        
                        callback(err,null);

                    } else { 

                        memberList = memberListResult;
                        
                        callback(null,memberListResult);

                    }
                });
                
            },
        ], function(err, results) {

            res.json({code:200, admList: admList, modList: modList, memberList: memberList});

        });

    }

    const getMemberList = function(req, res) {

        const club_name = req.body.club_name;
        console.log(club_name);

        req.connection.query('SELECT users.username, users.id FROM club_members' +
        ' INNER JOIN users ON club_members.user_id = users.id ' +
        ' WHERE club_members.club_id = (SELECT clubs.id FROM clubs WHERE clubs.club_name = ?)', club_name ,
            function (err, memberList) {
            if (err) {

            } else {

                const result = memberList;
                
                if (result) {
                    res.json({memberList: result});
                } else {
                    res.json({err: err});
                }
            }
        });

    }

    const checkClub = function(req, res) {

        tokenInformation = getTokenInformation(req.body.token);

        const userInformation  = {
            user_id: tokenInformation._id,
            birthdate :  req.body.birthdate,
            city_id:  req.body.city_id,
            completed:  req.body.completed,
            email_confirmed:  req.body.email_confirmed,
            gender_id:  req.body.gender_id,
            partner_birthdate:  req.body.partner_birthdate,
            club_name: req.body.club_name
        };

        const sql = 'SELECT ' + 
                        'clubs.id,  IF(clubs.user_id = ?, 1, 0) AS club_adm, ' + 
                        ' IF(club_applications.user_id = ?, 1, 0) AS has_application , ' + 
                        ' clubs.club_name, clubs.description, clubs.private, clubs.image,  ' +
                        '(SELECT COUNT(*) FROM club_members WHERE club_members.club_id = clubs.id) AS total_members, ' +
                        '(SELECT COUNT(club_members.id) FROM club_members ' +
                            'INNER JOIN clubs ON clubs.id = club_members.club_id ' +
                            'WHERE club_members.user_id = ? AND clubs.club_name = ?) AS is_member,   ' +
                        'IF(club_genders.gender_id = ?, 1, 0) AS gender_allowed,  clubs.min_age, clubs.max_age, clubs.city_id  ' +
                    'FROM ' +
                        'clubs   ' +
                    'INNER JOIN   ' + 
                        'club_genders ON club_genders.club_id = clubs.id  ' +
                    'INNER JOIN   ' +
                        'club_members ON club_members.club_id = clubs.id   ' +
                    'LEFT JOIN   ' +
                        'club_applications ON club_applications.club_id = clubs.id  ' +
                    'LEFT JOIN   ' +
                        'users ON club_members.club_id = users.id  ' +
                    'WHERE   ' + 
                        'clubs.club_name = ?  AND ' +
                        'club_genders.gender_id = ? ' +
                    'GROUP BY   ' +
                        'clubs.id   ' +
                    'ORDER BY   ' +
                        'total_members DESC   '; 
        


        req.connection.query(sql,[userInformation.user_id,
                                  userInformation.user_id,
                                  userInformation.user_id, 
                                  userInformation.club_name, 
                                  userInformation.gender_id, 
                                  userInformation.club_name, 
                                  userInformation.gender_id],
            function (err, clubInformation) {
            if (err) {
                console.log(err);
            } else {
                
                const result = clubInformation;

                if(result[0]) {

                   

                    res.json({code:200, clubInformation: result[0]});

                } else {

                    res.json({code:404, message: "Club not found"});

                }
                
            }
        });



    }


    const applyToClub = function(req, res) {

        userInformation = getTokenInformation(req.body.token);

        applicationInformation = {
            user_id : userInformation._id,
            reason: req.body.reason,
            club_id: req.body.club_id
        }

        console.log(applicationInformation);

        req.connection.query("INSERT INTO club_applications (club_applications.club_id, club_applications.user_id, club_applications.reason, club_applications.application_date) " + 
                             "VALUES (?, ?, ?, NOW())",
                                     [applicationInformation.club_id, applicationInformation.user_id, applicationInformation.reason], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else {
                console.log(200);
                
                res.json({code:200, message: "Application created with success"});

            }
        });

    }

    const joinCLub = function(req, res) {

        userInformation = getTokenInformation(req.body.token);

        joinClubInformation = {
            user_id : userInformation._id,
            club_id: req.body.club_id
        }

        req.connection.query("INSERT INTO club_members (club_members.club_id, club_members.user_id, club_members.registration_date, club_members.member_role_id) " + 
                             "VALUES (?, ?, NOW(), ?)",
                                     [joinClubInformation.club_id, joinClubInformation.user_id, 3], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else { 
                console.log(200);
                
                res.json({code:200, message: "Application created with success"});

            }
        });


    }

    const leaveClub = function(req, res) {

        userInformation = getTokenInformation(req.body.token);


        leaveClubInformation = {
            user_id : userInformation._id,
            club_id: req.body.club_id
        }

        console.log(leaveClubInformation);

        req.connection.query("DELETE FROM club_members WHERE club_members.club_id = ? AND club_members.user_id = ?",
                                     [leaveClubInformation.club_id, leaveClubInformation.user_id], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else {
                console.log(200);
                
                res.json({code:200, message: "Application created with success"});

            }
        });
        
    }

    const getApplications = function(req,res) {

        club_name = req.body.club_name;

        req.connection.query(" SELECT club_applications.id, club_applications.user_id, club_applications.club_id, club_applications.reason, club_applications.application_date, users.username, " +
                             " users.gender_id, users.birthdate, users.partner_birthdate, users.image  FROM projecthfx.club_applications " +
                             " LEFT JOIN clubs ON club_applications.club_id = clubs.id " +
                             " LEFT JOIN users ON club_applications.user_id = users.id " +
                             " WHERE clubs.club_name = ?",
                                     [club_name], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else {
                console.log(200);
                
                res.json({code:200, applicationList: result});

            }
        });

    }

    const declineRequest = function(req, res) {

        requestInformation = {
            application_id: req.body.application_id
        };

        req.connection.query("DELETE FROM club_applications WHERE club_applications.id = ?",
                                     [requestInformation.application_id], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else {
                console.log(200);
                
                res.json({code:200, message: "Request declined with success"});

            }
        });
    }

    const acceptRequest = function(req, res) {

        requestInformation = {
            user_id : req.body.user_id,
            club_id : req.body.club_id,
            application_id : req.body.application_id
        }

        console.log(requestInformation);

        async.parallel([
            function(callback) {

                req.connection.query("INSERT INTO club_members (club_members.club_id, club_members.user_id, club_members.registration_date, club_members.member_role_id) " + 
                             "VALUES (?, ?, NOW(), ?)",
                                     [requestInformation.club_id, requestInformation.user_id, 3], (err, result) => {
                    if(err) {
                        
                        
                        callback(err,null);

                    } else { 
                        console.log(200);
                        
                        callback(null,true);

                    }
                });
                
            },
            function(callback) {

                req.connection.query("DELETE FROM club_applications WHERE club_applications.id = ?",
                                     [requestInformation.application_id], (err, result) => {
                    if(err) {
                        
                        console.log(err);
                        callback(err,null);


                    } else {
                        console.log(200);
                        
                        callback(null,true);

                    }
                });

            }
        ], function(err, results) {

            // SEND AN EMAIL TO A USER

            res.json({code:200});
        });

    }

    const chekcUsername = function(req, res) {

        const checkInformation = {
            username : req.body.username,
            club_id: req.body.club_id
        }

        req.connection.query(' SELECT COUNT(users.id) as is_member, users.id FROM club_members ' +
                             ' LEFT JOIN users ON users.id = club_members.user_id ' +
                             ' WHERE club_members.club_id = ? AND users.username = ? ', [checkInformation.club_id, checkInformation.username] ,
            function (err, memberList) {
            if (err) {
                res.json({code:400})
            } else {
                const result = memberList;

                res.json({code:200, memberList: result[0]});

            }
        });

    }

    const changeClubOwner = function(req, res) {

        const userInformation = getTokenInformation(req.body.token);

        changeClubOwnerInformation = {
            new_club_owner_id : req.body.new_owner_id,
            club_id : req.body.club_id,
            user_id : userInformation._id
        }

        console.log('-----------------------------------');
        
        console.log(changeClubOwnerInformation);
        console.log('-----------------------------------');


        async.parallel([
            function(callback) {

                const sql = "UPDATE clubs SET user_id = ? WHERE id = ? ";

                req.connection.query(sql, [changeClubOwnerInformation.new_club_owner_id, changeClubOwnerInformation.club_id], (err, result) => {
                    if(err) {

                        console.log(err);
                        
                        callback(err,null);

                    } else { 
                        
                        callback(null,true);

                    }
                });
                
            },
            function(callback) {

                const sql = "UPDATE club_members SET club_members.member_role_id = 3 WHERE club_members.club_id = ? AND club_members.user_id = ? ";

                req.connection.query(sql, [changeClubOwnerInformation.club_id, changeClubOwnerInformation.user_id], (err, result) => {
                    if(err) {
                        console.log(err);

                        callback(err,null);

                    } else {
                        
                        callback(null,true);

                    }
                });

            },
            function(callback) {

                const sql = "UPDATE club_members SET club_members.member_role_id = 1 WHERE club_members.club_id = ? AND club_members.user_id = ? ";

                req.connection.query(sql, [changeClubOwnerInformation.club_id, changeClubOwnerInformation.new_club_owner_id], (err, result) => {
                    if(err) {
                        console.log(err);

                        callback(err,null);

                    } else {
                        
                        callback(null,true);

                    }
                });

            }
        ], function(err, results) {

            // SEND AN EMAIL TO A USER SAYING THAT HE IS NEW CLUB OWNER OF THIS CLUB

            res.json({code:200});


        });

    } 

    const kickMember = function(req, res) {

        kickInformation = {
            user_id: req.body.user_id,
            club_id: req.body.club_id
        };

        req.connection.query("DELETE FROM club_members WHERE club_members.user_id = ? AND club_members.club_id = ?",
                                     [kickInformation.user_id, kickInformation.club_id,], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else {
                console.log(200);

                // SEND AN EMAIL TO USER to inform them that they are not a member of that club any more
                
                res.json({code:200, message: "Member kicked with sucess"});

            }
        });
    }

    const getUserClubs = function(req, res) {

        user_id = req.body.user_id;

        req.connection.query(" SELECT clubs.club_name, clubs.private, clubs.image, " +
                             " (SELECT COUNT(*) FROM club_members WHERE club_members.club_id = clubs.id) AS total_members  FROM clubs " +
                             " INNER JOIN club_members AS club_members ON club_members.club_id = clubs.id " +
                             " WHERE club_members.user_id = ?",
                             [user_id], (err, result) => {
            if(err) {
                
                console.log(err);
                res.json({code:400, message:'Error in saving the application', err:err});


            } else {
                console.log(200);
                
                res.json({code:200, userClubList: result});

            }
        });

    }


    // FUNCTIONS

    const getAllPublicClubsNotJoined = function (req, userData, callback) {

        let sql;
        let params;

        if(userData.partner_birthdate) {

            sql =   "SELECT " +
                        "clubs.id, clubs.club_name, clubs.private,clubs.image, (SELECT COUNT(*) FROM club_members WHERE club_members.club_id = clubs.id) AS total_members " +
                    "FROM " +
                        "clubs " +
                    "LEFT JOIN  " +
                        " club_genders ON club_genders.club_id = clubs.id " +
                    "LEFT JOIN " +
                        " club_members ON club_members.club_id = clubs.id " +
                    "WHERE  " +
                        "clubs.max_age >= ? AND " +
                        "clubs.min_age <= ? AND " +
                        "clubs.max_age >= ? AND " +
                        "clubs.min_age <= ? AND " +
                        "clubs.city_id = ? AND " +
                        "club_genders.gender_id = ? AND " +
                        "club_members.user_id != ? AND " +
                        "club_members.club_id NOT IN (SELECT club_id FROM projecthfx.club_members WHERE user_id = ?) " +
                    "GROUP BY " +
                        "clubs.id ORDER BY total_members DESC";

            params = [ userData.user_age, 
                       userData.user_age, 
                       userData.partner_birthdate, 
                       userData.partner_birthdate, 
                       userData.city_id, 
                       userData.gender_id, 
                       userData.user_id,
                       userData.user_id];

        } else {

            sql =   "SELECT " +
                        "clubs.id, clubs.club_name, clubs.private,clubs.image, (SELECT COUNT(*) FROM club_members WHERE club_members.club_id = clubs.id) AS total_members " +
                    "FROM " +
                        "clubs " +
                    "LEFT JOIN  " +
                        " club_genders ON club_genders.club_id = clubs.id " +
                    "LEFT JOIN " +
                        " club_members ON club_members.club_id = clubs.id " +
                    "WHERE  " +
                        "clubs.max_age >= ? AND " +
                        "clubs.min_age <= ? AND " +
                        "clubs.city_id = ? AND " +
                        "club_genders.gender_id = ? AND " +
                        "club_members.user_id != ? AND " +
                        "club_members.club_id NOT IN (SELECT club_id FROM projecthfx.club_members WHERE user_id = ?) " +
                    "GROUP BY " +
                        "clubs.id ORDER BY total_members DESC";
            
            params = [ userData.user_age, userData.user_age, userData.city_id, userData.gender_id, userData.user_id, userData.user_id];

        }

        req.connection.query(sql, params,
            function (err, clubList) {
            if (err) {
            } else {

                const result = clubList;
                if (result) {
                    callback(null, result);
                } else {
                    callback(err, null);
                }
            }
        });
    };

    const getAllJoinedClubs = function (req, userData, callback) {

        

        req.connection.query('SELECT ' +
            'clubs.id, clubs.club_name, clubs.private,clubs.image, (SELECT COUNT(*) FROM club_members WHERE club_members.club_id = clubs.id) AS total_members ' +
            'FROM ' +
                'clubs ' +
            'LEFT JOIN '+
	            'club_members ON club_members.club_id = clubs.id ' +
            'WHERE ' + 
                'club_members.user_id = ? ' +
            'GROUP BY ' +
	            'clubs.id ' +
            'ORDER BY ' + 
	            ' total_members DESC ',[userData.user_id],
            function (err, clubList) {
            if (err) {
            } else {
                const result = clubList;
                if (result) {
                    callback(null, result);
                } else {
                    callback(err, null);
                }
            }
        });
    };

    const getTokenInformation = function(token) {
        return jwt.verify(token,'projectHFX');
    };





    return{

        newClub : newClub,
        getClubs: getClubs,
        getClubMembers: getClubMembers,
        checkClub: checkClub,
        applyToClub: applyToClub,
        leaveClub: leaveClub,
        joinCLub : joinCLub,
        getApplications: getApplications,
        declineRequest: declineRequest,
        acceptRequest: acceptRequest,
        getMemberList: getMemberList,
        chekcUsername: chekcUsername,
        changeClubOwner: changeClubOwner,
        kickMember: kickMember,
        getUserClubs: getUserClubs

    };


};

module.exports = clubController;