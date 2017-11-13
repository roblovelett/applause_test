var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var glob = require("glob");
var testers = require('./routes/testers'); //routes are defined here
var fs = require('fs');
//var csvParser = require("csvtojson"); // csv parser
var app = express(); //Create the Express app
var csvParser = require('fast-csv');

    var csvfiles = glob.sync('csv/*.csv'); // get list of csv files
    var parsed_ids = [];
    var parsed_names = [];
    var parsed_countries = [];

    // required csv files to parse
    const csvfiles_req = {
        testers: 'csv/testers.csv',
        bugs: 'csv/bugs.csv',
        devices: 'csv/devices.csv',
        tester_device: 'csv/tester_device.csv'
    };

    var stream; // csv stream to be parsed

    for (i=0; i < csvfiles.length; i++) {
        switch (csvfiles[i]) {
            case (csvfiles_req.testers) :    
                stream = fs.createReadStream(csvfiles_req.testers);
                csvParser
                .fromStream(stream, {headers: ["testerId","firstName","lastName", "Country",,]})
                .on("data", (data) => {

                    console.log(data);
                })
                .on("end", () => {
                    console.log("done");
                });            
                //stream.pipe(csvStream);
                break;
            case (csvfiles_req.bugs) :
                //parse data from bugs.csv
                break;
            case (csvfiles.devices) :
                //parse data from devices.csv
                break;
            case (csvfiles.tester_device) :
                //parse data from tester_device.csv
                break;
            default :
                console.log ('cannot find necessary csv files to parse. /n');
        };
    };




// parse csv data


// populate data to testers


//connect to our database
//Ideally you will obtain DB details from a config file
var dbName = 'testerDB';
var mongodb = 'mongodb://localhost:27017/' + dbName;

mongoose.connect(mongodb);

app.use(bodyParser.json()); //configure body-parser
app.use(bodyParser.urlencoded());
app.use(express.static(__dirname + '/public')); // serve static files

app.get("/", function(req, res) { // Basic route that sends the user first to the AJAX Page
    console.log('request: /n' + req);
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use('/api', testers); //This is our route middleware

module.exports = app;