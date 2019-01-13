const doUntil = require('async/doUntil');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

//---------------CONTROLLERS-----------------------
var configController = require("../configuration/configController")();
//------------END--CONTROLLER----------------------

//---------------VARIABLES-----------------------
var url = configController.dbUrl();
//------------END--VARIABLES----------------------


var messageController = function (app) {


    const chatList = function(req,res) {

        
        const userInformation = getTokenInformation(req.body.token);

        console.log(userInformation.username);

        const sql = "SELECT chats.id," +
                    " if(users_a.username != ?, users_a.username, IF(users_b.username != ?, users_b.username, null)) AS chat_user  " +
                    " FROM chats  " +
                    " INNER JOIN users AS users_a ON users_a.id = chats.user_one " +
                    " INNER JOIN users AS users_b ON users_b.id = chats.user_two " +
                    " WHERE chats.user_one = ? OR chats.user_two = ? ";

        req.connection.query(sql,[userInformation.username, userInformation.username, userInformation._id, userInformation._id], (err, result) => {

            if (err) {

                return res.json(err);

            } else{

                res.json({chatList: result});

            }

        });

    };



    const chatMessages = function(req,res) {

        const userInformation = getTokenInformation(req.body.token);
        const message_to = req.body.message_to;
        let user_receiver_id = '';

        const sql = " SELECT users.id FROM users WHERE users.username = ? ";

        req.connection.query(sql, [message_to] , (err, result) => {

            if (err) {
                console.log(err);

                return res.json(err);

            } else{

                user_receiver_id = result[0].id;

                const sql = " SELECT chat_messages.text, chat_messages.chat_id, chat_messages.message_date, user_receiver.username AS receiver, user_sender.username AS sender, " +
                            " if(user_sender.username = ?, user_sender.username,  null) AS user_receiver  FROM chat_messages  " +
                            " LEFT JOIN users AS user_sender   ON chat_messages.sender_id = user_sender.id  " +
                            " LEFT JOIN users AS user_receiver ON chat_messages.receiver_id = user_receiver.id  " +
                            " WHERE ((chat_messages.sender_id = ? OR chat_messages.receiver_id = ?) AND  " +
                            " (user_sender.username = ? OR user_receiver.username = ?)) " + 
                            " ORDER BY message_date ASC ";

                req.connection.query(sql,[message_to,
                                        userInformation._id, 
                                        userInformation._id, 
                                        message_to, 
                                        message_to], (err, result) => {

                    if (err) {
                        console.log(err);

                        return res.json(err);

                    } else{

                        console.log(result);

                        res.json({messageList: result, user_receiver_id: user_receiver_id});

                    }

                });



            }

        });

    };

    const sendMessage = function (req,res) {


        let tokenInformation = jwt.verify(req.body.token,'projectHFX');

        const messageData = {
            sender_id: tokenInformation._id,
            receiver_id: req.body.message_to_user_id,
            text: req.body.message,
            chat_id : req.body.chat_id
        };

        const sql = "INSERT INTO chat_messages (chat_id, sender_id, receiver_id, text, message_date) " +  
                    " VALUES (?, ?, ?, ?, NOW())";

        req.connection.query(sql,[messageData.chat_id, 
                                  messageData.sender_id,
                                  messageData.receiver_id,
                                  messageData.text], (err, result) => {

            if (err) {

                console.log(err);

                return res.json(err);

            } else{

                console.log(result.insertId);

                const selectSql = " SELECT chat_messages.text, chat_messages.chat_id, chat_messages.message_date, user_receiver.username AS receiver, user_sender.username AS sender, " +
                            " if(user_sender.id = ?, user_sender.username,  null) AS user_receiver  FROM chat_messages  " +
                            " LEFT JOIN users AS user_sender   ON chat_messages.sender_id = user_sender.id  " +
                            " LEFT JOIN users AS user_receiver ON chat_messages.receiver_id = user_receiver.id  " +
                            " WHERE chat_messages.id = ? ";


                req.connection.query(selectSql,[messageData.receiver_id,result.insertId], (err, resultSelect) => {

                    if (err) {
        
                        console.log(err);
        
                        return res.json(err);
        
                    } else{
        
                        console.log(resultSelect);
        
                        res.json({code:200, newMessage: resultSelect[0]});
        
                    }
        
                });

            }

        });




    };

    const getTokenInformation = function(token) {
        return jwt.verify(token,'projectHFX');
    };


    /*const messagePost = function(req, res) {

        let tokenInformation = jwt.verify(req.body.token,'projectHFX');

        const messagePost = {
            messageer_user_id: tokenInformation._id,
            messageed_post_id: req.body.messageed_post_id,
            message_id: req.body.message_id,
            comment: req.body.comment
        }

        console.log(messagePost);

        const sql = "INSERT INTO post_messages (messageer_user_id, messageed_post_id, message_id, comment, message_date) " +  
                    " VALUES (?, ?, ?, ?, NOW())";

        req.connection.query(sql,[messagePost.messageer_user_id,
                                  messagePost.messageed_post_id,
                                  messagePost.message_id,
                                  messagePost.comment], (err, messageResult) => {

            if(err) {
                console.log(err);
                res.json(err);
            } else {
                console.log(messageResult);
                res.json({code: 200});
            }

        });

        

    }*/





    return{
        chatList: chatList,
        chatMessages: chatMessages,
        sendMessage : sendMessage
    };


};

module.exports = messageController;