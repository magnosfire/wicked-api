var express = require("express");
var postRouter = express.Router();
var multer  = require('multer');


var postController = require("./postController")();
var upload = multer();

var router = function () {

    postRouter.route("/")
        .post(upload.array('avatar', 12),postController.newpost);

    postRouter.route("/updatePost")
        .post(postController.updatePost);

    postRouter.route("/:pagination&:clubName")
        .get(postController.getPosts);

    postRouter.route("/pinAPost")
        .post(postController.pinAPost);

    postRouter.route("/removePin")
        .post(postController.removePin);

        


        
    return postRouter;
};

module.exports = router;
