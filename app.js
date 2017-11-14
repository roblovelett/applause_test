var express = require('express');
var bodyParser = require('body-parser');
//var mongoose = require('mongoose');
var glob = require("glob");
var csvParser = require('fast-csv');
var testers = require('./routes/testers'); //routes are defined here
var fs = require('fs');
//var db = require('./bin/db');
var app = express(); //Create the Express app

// app setup
var PORT = process.env.PORT || 3000;

// required csv files to parse
const csvfiles_req = {
    testers: 'csv/testers.csv',
    bugs: 'csv/bugs.csv',
    devices: 'csv/devices.csv',
    tester_device: 'csv/tester_device.csv'
};

// csv parser
const csvfiles = glob.sync('csv/*.csv'); // get list of csv files
var db = [];
//var stream = '';

for(i=0; i < csvfiles.length; i++) {   
    if(csvfiles[i] === csvfiles_req.testers) {
        console.log('testers.csv found. \n Parsing... \n');
        var stream = fs.createReadStream(csvfiles_req.testers);
        csvParser.fromStream(stream, {headers: ["testerId","firstName","lastName", "Country",,]})
        .on("data", (data) => {
            db.push(data);
        })
        .on("end", () => {
            db.shift(); // wish I didn't have to do this there's no way to omit the lastLogin column and delete the headers at same time
            console.log('Done. \n')
            getDevices(stream, db)
        });
    } else if (i+1 === csvfiles.length) {
        console.log('Cannot find testers.csv. Required to create database. \n');
        break;
    };
    continue;
};

var getDevices = (stream, db) => {

    var Devices = {};
    var deviceId;
    var deviceName;

    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] === csvfiles_req.devices) {
            console.log('devices.csv found. \n Parsing... \n');
            stream = fs.createReadStream(csvfiles_req.devices);
            csvParser
            .fromStream(stream, {headers: false})
            .on("data", (data) => {
                //get values from 
                deviceName = data[1];
                deviceId = data[0];

                Devices[deviceId] = {
                    name: deviceName,
                    bugCount: 0 // init bug counter to 0 for each device 
                };
            })
            .on("end", () => {
                delete Devices.deviceId; // wish not have to do this but headers: false not working and idk why
                console.log('Done. \n')
                for (i=0; i < db.length; i++) {                  
                    db[i].Devices = Object.assign({}, Devices);
                };
                getBugCount(stream, db);
            });
        } else if (i+1 === csvfiles.length) {
            console.log('Cannot find devices.csv. Required to create database. \n');
            break;
        };
        continue;
    };
};

var getBugCount = (stream, db) => {
    // match deviceId, Names, and bug count
    // inject into db
};

/*
var data = {
    'PropertyA': 1,
    'PropertyB': 2,
    'PropertyC': 3
};
var propertyName = "someProperty";
var propertyValue = "someValue";
Either:

data[propertyName] = propertyValue;
*/

/*
    var stream = fs.createReadStream(csvfiles_req.testers);
    csvParser
    .fromStream(stream, {headers: ["testerId","firstName","lastName", "Country",,]})
    .on("data", (data) => {
            
    })
    .on("end", () => {
        console.log("done");
    });
};

    if (find.csvfiles(csvfiles_req.testers) === 'true') {

    } 
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


//app.locals.db = getInitData(db);

//console.log(app.locals.db);
/*
    

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
/*
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
*/


module.exports = app;