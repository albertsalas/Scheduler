const express = require("express");
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
var session = require('express-session')
//Enable sessions
app.use(session({
    secret: 'secret',
    path: '/',
    resave: false,
    saveUninitialized: true,

    //cookie: { secure: false }

}));

app.use(function(req, res, next) {
    res.locals.loggedin = req.session.loggedin;
    res.locals.username = req.session.username;
    next();
});


app.set("view engine", "ejs");
app.set('views', __dirname + '/views');
app.use(express.static("public"));

// enable use of json
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

const connnection = mysql.createConnection({
    host: 'am1shyeyqbxzy8gc.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'l62bvqvyud4q9pk4',
    password: 'hc2gyl5w6krxjdja',
    database: 'xztdtf52rqoeoolm'
});

// routes
app.get("/", function(req, res) {
    res.render("index", {
        newUser: false
    });
});

app.get("/dashboard",  function(req, res) {
    let userId = req.session.username;
    // console.log(req.session);
    // console.log("in dashboard");
    // console.log(req.session.loggedin)
    // let username = await getUsername(userId);
    if (req.session.loggedin) {
        connnection.query(
            `SELECT u.username, t.*
            FROM users u
            left join time_slots t on u.id = t.user_id
            WHERE u.id = "${userId}"`,
            (error, results, fields) => {
                console.log(results);
                if (error) throw error;
                var date = new Date();
                var time_slots = [];
                var username = results[0].username
                if (results.length > 0) {
                    for (var i = 0; i < results.length; ++i) {
                        if (results[i].end_time > date) {
                            time_slots.push(results[i]);
                            // console.log(time_slots[i].id)
                        }
                    }
                }
                res.render('dashboard', {
                    time_slots: time_slots,
                    username: username,
                    userId: userId
                });
            }
        ); // query
    }
    else {
        delete req.session.username;
        res.redirect('/');
    }

});

app.get("/dashboard/timeslot", function(req, res) {
    var id = req.query.id;
    connnection.query(
        `SELECT * FROM time_slots WHERE id = ${id};`,
        (error, results, fields) => {
            if (error) throw error;
            var appt = [];
            appt.push(results[0].start_time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            }));
            appt.push(results[0].end_time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            }));
            res.send(appt);
        }
    ); // query
});

app.post("/dashboard/delete", function(req, res) {
    var id = req.body.id
    connnection.query(
        `DELETE FROM time_slots WHERE id = ${id};`,
        (error, results, fields) => {
            if (error) throw error;
        }
    ); // query
});

app.post("/dashboard/add", function(req, res) {
    // console.log(req.body);
    var date = req.body.date;
    var start_time = date + " " + req.body.start_time;
    var end_time = date + " " + req.body.end_time;
    var user_id = req.body.userId;
    res.send("response");
    connnection.query(
        `INSERT INTO time_slots (date, start_time, end_time, user_id)
        VALUES ("${date}", "${start_time}", "${end_time}", "${user_id}");`,
        (error, results, fields) => {
            if (error) throw error;
        }
    ); // query
});

app.post("/createAccount", function(req, res) {
    // var username = req.header("username");
    // var password = req.header("password");
    let username = req.body.username;
    let password = req.body.password;
    var validUsername;

    connnection.query(
        `SELECT * FROM users WHERE username = "${username}"`,
        (error, results, fields) => {
            // console.log(results);
            if (error) {
                throw (error);
            }
            if (results.length > 0) {
                validUsername = false;
            }
            else {
                validUsername = true;
            }
            // console.log(validUsername);
            if (validUsername) {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    if (err) throw error;
                    connnection.query(`INSERT INTO users (username, password) VALUES ("${username}", "${hash}");`,
                        (error, result, fields) => {
                            res.send({
                                newUser: true,
                                username: username
                            })
                            if (error) throw error;
                        });
                });
            }
            else {
                // console.log("not valid username")
            }
        }); // query
});

app.post("/signIn", function(req, res) {
    var username = req.header("username");
    var password = req.header("password");
    var validUsername;
    var hashedPassword;
    var userId;

    connnection.query(
        `SELECT * FROM users WHERE username = "${username}"`,
        (error, results, fields) => {
            if (error) {
                throw (error);
            }
            if (results.length == 1) {
                validUsername = true;
                hashedPassword = results[0].password.toString();
                userId = results[0].id;
                console.log(userId);
            }
            else {
                validUsername = false;
            }
            if (validUsername) {
                bcrypt.compare(password, hashedPassword, function(err, resp) {
                    if (err) {
                        throw error;
                    }
                    if (resp === true) {
                        req.session.loggedin = true;
                        req.session.username = userId;
                        // console.log("login success");
                        res.send({
                            success: true
                        });
                    }
                    else {
                        // console.log("wrong password");
                    }
                });
            }
            else {
                // console.log("not valid username");
                res.send({
                    success: false
                })
            }
        }); // query
});

app.get('/logout', function(req, res, next) {

    if (req.session) {
        // delete session object
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            }
            else {
                return res.json({
                    successful: true,
                    message: ''
                });
            }
        });
    }
});

// function getUsername(userId) {
//     return new Promise(function(resolve, reject) {
//         connnection.query(
//             `SELECT username FROM users WHERE id = "${userId}";`,
//             (error, results, fields) => {
//                 var username = results;
//                 console.log(username);
//                 if (error) {
//                     return reject(error);
//                 };
//                 resolve(results[0]);
//             }
//         ); // query
//     });
// }

// running server
app.listen(process.env.PORT || 3000, process.env.IP, function() {
    console.log("Express server is running...");
});
