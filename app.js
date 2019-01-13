var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var helmet = require('helmet');
var pool = require('./app/configuration/pool-factory');
var connectionMiddleware = require('./connection-middleware');

app.use(connectionMiddleware(pool));



var port = process.env.PORT || 8080;


app.use(bodyParser.json({limit: "5000mb"}));
app.use(bodyParser.urlencoded({limit: "5000mb", extended: true, parameterLimit:500000000000000000000}));

app.use(helmet());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept');
    next();
});


var userRouter              = require("./app/user/userRoutes")(app);
var clubRouter              = require("./app/club/clubRoutes")(app);
var countryRouter              = require("./app/country/countryRoutes")(app);
var provinceRouter              = require("./app/province/provinceRoutes")(app);
var cityRouter              = require("./app/city/cityRoutes")(app);
var postRouter              = require("./app/post/postRoutes")(app);
var commentRouter              = require("./app/comment/commentRoutes")(app);
var emailRouter              = require("./app/email/emailRoutes")(app);
var reportRouter              = require("./app/report/reportRoutes")(app);
var messageRouter              = require("./app/message/messageRoutes")(app);

app.use("/User", userRouter);
app.use("/Club", clubRouter);
app.use("/Country", countryRouter);
app.use("/Province", provinceRouter);
app.use("/City", cityRouter);
app.use("/Post", postRouter);
app.use("/Comment", commentRouter);
app.use("/Email", emailRouter);
app.use("/Report", reportRouter);
app.use("/Message", messageRouter);





var server = app.listen(port, function () {

    console.log("Server running at http://127.0.0.1:8080/");

});