var express = require('express');
var bodyParser = require('body-parser');
//var mongoose = require('mongoose');
var glob = require("glob");
var csvParser = require('fast-csv');
var path = require("path");
var testers = require('./routes/testers'); //routes are defined here
var fs = require('fs');
//var db = require('./bin/db');
//var csvParser = require("csvtojson"); // csv parser
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
            
            //error
            if (i+1 === csvfiles.length) {
                console.log('Cannot find testers.csv. Required to create database. \n');        
            };

            getDevices(stream, db)
        });
    }
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
                    continue;
                };
                
                if (i+1 === csvfiles.length) {
                    console.log('Cannot find devices.csv. Required to create database. \n');        
                };

                getBugCount(stream, db);
            
            });
        };     
    };
};

var getBugCount = (stream, db, dbDevicesNum) => {
    
    var deviceId_db;
    var testerId_db;
    var deviceId_parsed;
    var testerId_parsed;
    var matchedTesterId;
    var matchedTester;
    var matchedDevice;
    var devicesNum = getDevicesNum(db);
    
    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] === csvfiles_req.bugs) {
            console.log('bugs.csv found. \n Parsing... \n');
            stream = fs.createReadStream(csvfiles_req.bugs);
            csvParser
            .fromStream(stream, {headers: [,"deviceId","testerId"]})
            .on("data", (data) => {
                testerId_parsed = data.testerId;
                deviceId_parsed = data.deviceId;
                for (i=0; i < db.length; i++) {
                    testerId_db = db[i].testerId;
                    if (testerId_db === testerId_parsed) {
                        console.log('testerId_db match: ' + testerId_db + '\n');
                        // seems testerId_db was string, conv. to # 
                        // find proper num tester obj. in db array 
                        // sub 1 since array starts 0
                        matchedTester = db[Number(testerId_db) - 1];
                        console.log(matchedTester);
                        // get matched tester obj. in db
                        //for (i=1; i = devicesNum; i++) {
                            //console.log(matchedTester.Devices[i]);
                            //if (matchedTester.testerIddeviceId_parsed)    
                            //if (deviceId_parsed === matchedTester.Devices[i]) {
                                //matchedDevice = matchedTester.Devices[i];
                                //console.log('matched device: ' + matchedDevice);
                                //console.log('matched: ')
                            //}
                            //if (deviceId_parsed === )
                    };
                        //for (i=0; i < testerId_db.Devices; )
                    
                        // get deviceId
                            // if deviceId equals db[i].Devices[i]
                        // if db[i].
                    // get deviceId
                    // got 1
                    
                };
            })
            .on("end", () => {
                console.log('Done. \n')
                if (i+1 === csvfiles.length) {
                    console.log('Cannot find bugs.csv. Required to create database. \n');        
                };

                // export db
            });        
        };
    };
};

// helper function
var getDevicesNum = (db) => {
    var counter;
    for (i=0; i < db.length; i++){
        if (i+1 === db.length) {
            // count how many devices are assigned to each user
            // need for final parsing
            // since uniform, we'll do it on last user
            var counter = Object.keys(db[i].Devices).length;
        };
    };
    return counter;    
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

var dbName = 'testerDB';
var mongodb = 'mongodb://localhost:27017/' + dbName;

mongoose.connect(mongodb);
*/

app.use(bodyParser.json()); //configure body-parser
app.use(bodyParser.urlencoded());
app.use(express.static(__dirname + '/public')); // serve static files

app.get("/", function(req, res) { // Basic route that sends the user first to the AJAX Page
    console.log('request: /n' + req);
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use('/api', testers); //This is our route middleware

module.exports = app;