var express = require("express");
var commentRouter = express.Router();
var commentController = require("./commentController")();

var router = function () {

    commentRouter.route("/")
        .post(commentController.newcomment);

    commentRouter.route("/:postId&:token")
        .get(commentController.getComments);

    commentRouter.route("/getReplies/:commentId&:token")
        .get(commentController.getReplies);

    commentRouter.route("/updateComment")
        .post(commentController.updateComment);
        

    return commentRouter;
};

module.exports = router;
