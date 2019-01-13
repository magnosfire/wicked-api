var express = require("express");
var messageRouter = express.Router();
var messageontroller = require("./messageController")();

var router = function () {
    
    messageRouter.route("/chat")
        .post(messageontroller.chatList);

    messageRouter.route("/chatMessages")
        .post(messageontroller.chatMessages);

    messageRouter.route("/sendMessage")
        .post(messageontroller.sendMessage);


        

    return messageRouter;
};

module.exports = router;
