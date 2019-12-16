const express = require("express");
const app = express();
const mysql = require('mysql');

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
    res.render("index");
});

app.get("/dashboard", function(req, res) {
    connnection.query(
        `SELECT *, IFNULL (booking_name, "Not Booked") AS booking_name FROM time_slots`,
        (error, results, fields) => {
            if (error) throw error;
            var date = new Date();
            var appts = [];
            for (var i = 0; i < results.length; ++i) {
                if (results[i].end_time > date) {
                    appts.push(results[i]);
                }
            }
            res.render("dashboard", {
                "appts": appts
            });
        }
    ); // query
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
    console.log(req.body);
    var date = req.body.date;
    var start_time = date + " " + req.body.start_time;
    var end_time = date + " " +req.body.end_time;
    res.send("response");
    connnection.query(
        `INSERT INTO time_slots (date, start_time, end_time)
        VALUES ("${date}", "${start_time}", "${end_time}");`,
        (error, results, fields) => {
            if (error) throw error;
        }
    ); // query
});

// running server
app.listen(process.env.PORT || 3000, process.env.IP, function() {
    console.log("Express server is running...");
});
