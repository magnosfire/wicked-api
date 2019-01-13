var express = require("express");

var clubRouter = express.Router();

var clubController = require("./clubController")();

var router = function () {

    clubRouter.route("/:token")
        .get(clubController.getClubs);

    clubRouter.route("/")
        .post(clubController.newClub);

    clubRouter.route("/members/:club_name")
        .get(clubController.getClubMembers);

    clubRouter.route("/getMemberList")
        .post(clubController.getMemberList);

    clubRouter.route("/checkClub")
        .post(clubController.checkClub);

    clubRouter.route("/applytoclub")
        .post(clubController.applyToClub);

    clubRouter.route("/leaveClub")
        .post(clubController.leaveClub);

    clubRouter.route("/joinCLub")
        .post(clubController.joinCLub);

    clubRouter.route("/getApplications")
        .post(clubController.getApplications);

    clubRouter.route("/acceptRequest")
        .post(clubController.acceptRequest);

    clubRouter.route("/declineRequest")
        .post(clubController.declineRequest);

    clubRouter.route("/chekcUsername")
        .post(clubController.chekcUsername);

    clubRouter.route("/changeClubOwner")
        .post(clubController.changeClubOwner);

    clubRouter.route("/kickMember")
        .post(clubController.kickMember);

    clubRouter.route("/getUserClubs")
        .post(clubController.getUserClubs);

        
        
        

    return clubRouter;
};

module.exports = router;
