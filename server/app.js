"use strict";

const path = require("path");
const express = require("express");
// Used for session cookie
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
// Simple in-memory session is used here. use connect-redis for production!!
const session = require("express-session");
// Used to send gziped files
const compression = require("compression");
// Used when requesting data from real services.
const proxy = require("./proxy");
// Get config serverConfig from local file or VCAPS environment variable in the cloud
const serverConfig = require("./server-config");
// Configure passport for authentication with UAA
const passportConfig = require("./passport-config");
// Configure https
const https = require('https');
const request = require('request');
// Only used if you have configured properties for UAA
let passport;
let mainAuthenticate;

// Express server
const app = express();

// App configuration
const config = serverConfig.getServerConfig();


// Constants
const HTTP_INTERNAL_ERROR_STATUS = 500;


/**********************************************************************
 SETTING UP EXPRESS SERVER
 ***********************************************************************/

app.set("trust proxy", 1);
app.use(cookieParser("predixsample"));
app.use(compression());

app.use(session({
    secret: "predixsample",
    name: "cookie_name",
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

if (config.uaaIsConfigured) {
    passport = passportConfig.configurePassportStrategy();
    app.use(passport.initialize());
    // Also use passport.session() middleware, to support persistent login sessions (recommended).
    app.use(passport.session());

    mainAuthenticate = function (options) {
        return passportConfig.authenticate(options);
    };
} else {
    mainAuthenticate = function () {
        return function (req, res, next) {
            next();
        };
    };
}

// Initializing application modules
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.listen(config.port, function () {
    console.log("Server is listening at: " + config.appURL);
});

/****************************************************************************
 SET UP EXPRESS ROUTES
 *****************************************************************************/

if (config.uaaIsConfigured) {
    // Login route redirect to predix uaa login page
    app.get("/login", passport.authenticate("predix", {scope: ""}));

    // Callback route redirects to secure route after login
    app.get("/callback", function (req, res, next) {
        const successRedirect = req.session[config.callbackProp] || "/";

        req.session[config.callbackProp] = null;
        passport.authenticate("predix", {
            successRedirect: successRedirect,
            failureRedirect: "/login"
        })(req, res, next);
    });

    // Logout route
    app.get("/logout", function (req, res) {
        req.session.destroy();
        req.logout();
        res.redirect(config.uaaURL + "/logout?redirect=" + config.appURL);
    });
}

// Secured route to access Predix services or backend microservices
app.use("/api", mainAuthenticate({noRedirect: true}), proxy.router);

// Route for direct calls to view
app.use("/view-*", mainAuthenticate(), function (req, res) {
    res.sendFile(process.cwd() + "/public/index.html");
});

// Use this route to make the entire app secure.  This forces login for any path in the entire app.
app.use("/", mainAuthenticate(),
    express.static(path.join(__dirname, process.env["base-dir"] ? process.env["base-dir"] : "../public"))
);


var access_token;
var refresh_token;
var accesscode;
var reportId = "5159317a-8556-478f-be0b-c22e1e117deb";
var groupId = "102b79a2-229e-4d79-9d90-24d15c14b278";

app.use("/redirect", function (req, res) {
    var accesscode = req.query.code;

    console.log('CODE: ' + req.query.code);
    //get access_token and refresh_token

    var form = {
        'grant_type': 'authorization_code',
        'code': accesscode,
        'client_id': '429565bf-9782-474a-8d4b-3c2449669c97',
        'redirect_uri': 'http://localhost:5000/redirect',
        'client_secret': 'LsQO0wUXht/OCkrjuudFRxyv6vJ2VXqVTm0C/yZhsao='
    };

    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/x-www-form-urlencoded',
    };

    // Configure the request
    var options = {
        url: 'https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/oauth2/token',
        method: 'POST',
        headers: headers,
        form: {
            'grant_type': 'authorization_code',
            'code': accesscode,
            'client_id': '429565bf-9782-474a-8d4b-3c2449669c97',
            'redirect_uri': 'http://localhost:5000/redirect',
            'client_secret': 'LsQO0wUXht/OCkrjuudFRxyv6vJ2VXqVTm0C/yZhsao='
        }
    };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObj = JSON.parse(body);

                console.log('access_token: ' + responseObj.access_token);
                console.log('refresh_token: ' + responseObj.refresh_token);
                app.set('access_token', responseObj.access_token);
                app.set('refresh_token', responseObj.refresh_token);
            
                return res.status(200).send('{ "access_token": "' + responseObj.access_token + '", "refresh_token: "' + responseObj.refresh_token + '" }');
            } else {
                return res.status(response.statusCode);
            }
        });
});

app.use("/newembedtoken", mainAuthenticate({noRedirect: true}), function (req, res) {

    // Set the headers
    var headers = {
        'Authorization':       'Bearer ' + app.get('access_token'),
        'Content-Type':     'application/json'
    }
    
    var groupId = '102b79a2-229e-4d79-9d90-24d15c14b278';
    var reportId = 'f451eb77-03e6-4c35-9fc1-ae1163290f4a';

    // TODO - change url to get group and id from request and generate token for specific report
    var requestUrl = 'https://api.powerbi.com/v1.0/myorg/groups/' + groupId + '/reports/' + reportId + '/GenerateToken';

    // Configure the request
    var options = {
        url: requestUrl,
        method: 'POST',
        headers: headers,
        form: {   
            "accessLevel": "View",
        } 
    }
    
    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var responseObj = JSON.parse(body);
            console.log('embed token: ' + responseObj.token);
            return res.status(200).send('{ "token": "' + responseObj.token + '" }');
        } else {
            // use refresh token and retry
            refreshAccessToken();
                // Set the headers
            var headers = {
                'Authorization':       'Bearer ' + app.get('access_token'),
                'Content-Type':     'application/json'
            };
            var options = {
                url: requestUrl,
                method: 'POST',
                headers: headers,
                form: {   
                    "accessLevel": "View",
                } 
            };
            // Start the request
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var responseObj = JSON.parse(body);
                    console.log('embed token: ' + responseObj.token);
                    return res.status(200).send('{ "token": "' + responseObj.token + '" }');
                } else {
                    // use refresh token and retry
                    return res.status(response.statusCode);
                }
            });
        }
    });
    
});

var refreshAccessToken = function() {
    // TODO implement
    // https://github.com/AzureAD/azure-activedirectory-library-for-nodejs/blob/2badd7c19e562c22fbdaff83e2d4bd524ab30c59/sample/username-password-sample.js
    // app.set(token)
};


app.use("/pbi", mainAuthenticate({noRedirect: true}), function (req, res) {
    res.sendFile(process.cwd() + "/public/pbi.html");
})
// //// error handlers //////

//  Development error handler - prints stacktrace
if (config.nodeEnv !== "cloud") {
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        if (res.headersSent) {
            return next(err);
        }
        res.status(err.status || HTTP_INTERNAL_ERROR_STATUS);
        return res.send({
            message: err.message,
            error: err
        });
    });
}

// Production error handler
// No stacktraces leaked to user
app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    if (!res.headersSent) {
        res.status(err.status || HTTP_INTERNAL_ERROR_STATUS);
        res.send({
            message: err.message,
            error: {}
        });
    }
});

module.exports = app;
