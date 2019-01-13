var express = require("express");

var multer  = require('multer');
var upload = multer();



var IncomingForm = require('formidable').IncomingForm;
var userRouter = express.Router();

var userController = require("./userController")();

var router = function () {

    userRouter.route("/signup")
        .post(userController.registerUser);

    userRouter.route("/tokenvalidation")
        .post(userController.tokenValidation);

    userRouter.route("/newPassword")
        .post(userController.newPassword);

    userRouter.route("/passwordreset")
        .post(userController.passwordReset);

    userRouter.route("/signup/step-two")
        .post(upload.array('avatar', 12), userController.registerStepTwoUser);

    userRouter.route("/login")
        .post(userController.login);

    userRouter.route("/usernameSuggestion/:username&:email")
        .get(userController.usernameSuggestion);

    userRouter.route("/checkUsernameAvailability/:username")
        .get(userController.checkUsernameAvailability);

    userRouter.route("/getBasicGenders")
        .get(userController.getBasicGenders);

    userRouter.route("/getSexOrientation/:sexOrientationId")
        .get(userController.getSexOrientation);

    userRouter.route("/getGendersAndSexOrientation")
        .get(userController.getGendersAndSexOrientation);

    userRouter.route("/profile/getProfileInformation")
        .post(userController.getProfileInformation);

    userRouter.route("/privacy/:token")
        .get(userController.getPrivacy);

    userRouter.route("/privacy")
        .post(userController.updatePrivacy);

    userRouter.route("/changePassword")
        .post(userController.changePassword);

    userRouter.route("/getPremiumInformation/:token")
        .get(userController.getPremiumInformation);
    
    userRouter.route("/newPremium")
        .post(userController.newPremium);

    userRouter.route("/rebillPremium")
        .post(userController.rebillPremium);

    userRouter.route("/profileUpdate")
        .post(userController.profileUpdate);

    userRouter.route("/getGendersInterest/:token")
        .get(userController.getGendersInterest);
    


    /*userRouter.post('/profile', upload.single('avatar'), function (req, res, next) {
        // req.body contains the text fields
        console.log(req.file);
        res.json({code: 200});
        })*/


    


    return userRouter;
};

module.exports = router;
