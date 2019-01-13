var configController = function () {


    var dbUrl = function () {
        return "mongodb://franzitaz:falcao10@ds227865.mlab.com:27865/imagina-art-db";
    };

    var secret = function () {
        return "3VenT_C0nTrOl";
    };

    return {
        dbUrl: dbUrl,
        secret: secret
    }


};

module.exports = configController;
