//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------

var api = require('sendwithus')('live_0670d5b00aff03edfeafbc7a555ff08b92befddc', debug=true);;




var emailController = function (app) {

    const sendEmailPasswordFail = function (req,res) {

        console.log('EMAILLL');

        const userData = {
            username : req.body.username,
            email    : req.body.email
        }

        getUserInformation(req, userData, function(err, userInformation) {

            const emailInformation = {
                username     : userInformation[0].username,
                email        : userInformation[0].email,
                emailTemplate: '1'
            }

            sendEmail(emailInformation, function(err,callback) {
                console.log(callback);

                res.json({code: 200, message: "The email was successfully sent."})
            })

        });

    };


    /*------- functions ----------- */

    const sendEmail = function(emailInformation, callback) {

        api.send({
            template: 'tem_2cAXbShMqPRcj5UQkctFmK',
            recipient: {
                address: 'rossini.magnus@gmail.com',
                name: emailInformation.username
            },
            template_data: { username: emailInformation.username }
        }, callback);

    };

    sendPasswordResetEmail = function(emailInformation, callback) {

       
        console.log('USERNAMEEEE');
            console.log(emailInformation);
    
            console.log('USERNAMEEEE');

        /*api.send({
            template: 'tem_2cAXbShMqPRcj5UQkctFmK',
            recipient: {
                address: 'rossini.magnus@gmail.com',
                name: emailInformation.username
            },
            template_data: { username: emailInformation.username }
        }, callback);*/

        return callback(null,'teste');

    };

    const getUserInformation = function(req, userData, callback) {

        req.connection.query('SELECT users.username, users.email FROM users WHERE users.username = ? OR users.email = ?', [userData.username, userData.email], function (err, userResult) { 

            if(err) {
                return callback(err, null);
            }

            return callback(null,userResult)

        });
    }

    return{
        
        sendEmailPasswordFail : sendEmailPasswordFail

    };


};

module.exports = emailController;