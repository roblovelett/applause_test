var express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
var testers = require('./routes/testers'); //routes are defined here
var fs = require('fs');
var glob = require('glob');
var csvParser = require('fast-csv');
var app = express(); //Create the Express app

// required csv files to parse
const csvfiles_req = {
    testers: 'csv/testers.csv',
    bugs: 'csv/bugs.csv',
    devices: 'csv/devices.csv',
    tester_device: 'csv/tester_device.csv'
};

// csv parser
const csvfiles = glob.sync('csv/*.csv'); // get list of csv files
var db = []; // init db

// parse testers.csv
for(i=0; i < csvfiles.length; i++) {   
    if(csvfiles[i] === csvfiles_req.testers) {
        console.log('testers.csv found. Parsing...');
        var stream = fs.createReadStream(csvfiles_req.testers);
        csvParser.fromStream(stream, {headers: ["testerId","firstName","lastName", "Country",,]})
        .on("data", (data) => {
            db.push(data);
        })
        .on("end", () => {
            db.shift(); // wish I didn't have to do this there's no way to omit the lastLogin column and delete the headers at same time
            console.log('Done.')
            
            //error
            if (i+1 === csvfiles.length) {
                throw new Error('Cannot find testers.csv. Required to create database.');        
            };

            getDevices(stream, db)
        });
    }
    continue;
};

// parse devices.csv
var getDevices = (stream, db) => {

    var Devices = {};
    var deviceId;
    var deviceName;

    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] === csvfiles_req.devices) {
            console.log('devices.csv found. Parsing...');
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
                console.log('Done.')
                for (i=0; i < db.length; i++) {                  
                    db[i].Devices = Object.assign({}, Devices);
                    continue;
                };
                
                if (i+1 === csvfiles.length) {
                    throw new Error('Cannot find devices.csv. Required to create database.');        
                };

                getBugCount(stream, db);
            
            });
        };     
    };
};

//parse bugs.csv
var getBugCount = (stream, db) => {
    
    var deviceId_db;
    var testerId_db;
    var deviceId_parsed;
    var testerId_parsed;
    var matchedTesterId;
    var matchedTester;
    var matchedDevice;
    
    const testersNum = db.length; // # of testers in db; need for api    
    const devicesNum = (db) => {
        for (i=0; i < db.length; i++){
            if (i+1 === db.length) {
                // # of devices assigned each user
                // need for final parsing, api
                // since uniform, count devices of last user
                var counter = Object.keys(db[i].Devices).length;
                break;
            };
        };
        return counter;    
    };
    const testers = (db) => {
        var testers = []; // init array of testers
        var tester;  
        for (i=0; i < testersNum; i++) {
            tester = db[i].firstName + db[i].lastName;
            testers[i] = tester;
        };
        return testers;
    };
    console.log(testers);
    
    const devices = (db) => {
        var devices = []; // init array of devices
        var device;
        for (i=0; i < devicesNum; i++) { // scan Devices, put in devices array
            // db array starts @ 0; Devices props start @ 1;
            device = db[testersNum - 1].Devices[i + 1].name;
            device.trim(); // trim any spaces
            devices[i] = device;
        };
        return devices;
    };
    console.log(devices);

    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] === csvfiles_req.bugs) {
            console.log('bugs.csv found. Parsing...');
            stream = fs.createReadStream(csvfiles_req.bugs);
            csvParser
            .fromStream(stream, {headers: [,"deviceId","testerId"]})
            .on("data", (data) => {
                testerId_parsed = data.testerId;
                deviceId_parsed = data.deviceId;
                for (i=0; i < db.length; i++) {
                    testerId_db = db[i].testerId;
                    if (testerId_db === testerId_parsed) {
                        // testerId_db is string, conv. to # 
                        // find proper num tester obj. in db array 
                        // - 1 since array starts 0
                        matchedTester = db[Number(testerId_db) - 1];
                        // find parsed deviceId in Tester obj. add to bugCount
                        matchedDevice = matchedTester.Devices[deviceId_parsed];
                        matchedDevice.bugCount ++;
                    };
                };
            })
            .on("end", () => {
                if (i+1 === csvfiles.length) {
                    throw new Error('Cannot find bugs.csv. Required to create database.');        
                };

                console.log('Done. \nDatabase created.');

                // app setup
                app.use(bodyParser.json({ extended: true }));
                app.use(bodyParser.urlencoded({ extended: true }));
                app.use(bodyParser.text({ extended: true }));
                app.use(bodyParser.json({ type: "application/vnd.api+json", extended: true }));
                
                // serve static files (public/*; css,js,etc)
                app.use(express.static(__dirname + '/public')); 
                app.set('port', process.env.PORT || 8000); //set port

                var server = app.listen(app.get('port'), function() {
                    console.log('App listening on port ' + server.address().port);
                });

                // routes
                app.get("/", function(req, res) { // Basic route that sends the user first to the AJAX Page
                    console.log('request: /n' + req);
                    res.sendFile(path.join(__dirname, "index.html"));
                });

                // Find most experienced Tester
                app.get('/api/countries=:country?/devices=:device?', (req, res) => {
                    
                    // db
                    // testersNum
                    // devicesNum
                    // db_res
                    
                    var testers = {
                        "countries": req.params.country,
                        "devices": req.params.device
                    };

                    for (i=0; i < testersNum; i++) {
                        if (testers.countries && testers.devices) {
                            if (testers.countries === 'all' && testers.devices === 'all') {
                                res.json('all/all');        
                            } else if (testers.countries === 'all' && testers.devices != 'all') {
                                // if device = 
                                res.json('all/*');
                            } else if (testers.countries != 'all' && testers.devices === 'all') {
                                res.json('*/all');
                            }
                        } else {
                            res.json(false);
                        };



                        res.json(characters[i]);
                        return;
                    };
                });

                // Search for Specific Character (or all characters) - provides JSON
                /*
                app.get("/api/:characters?", function(req, res) {
                    var chosen = req.params.characters;
                
                    if (chosen) {
                        console.log(chosen);
                
                        for (var i = 0; i < characters.length; i++) {
                            if (chosen === characters[i].routeName) {
                            res.json(characters[i]);
                            return;
                            }
                        }
                
                    res.json(false);
                    }
                    else {
                    res.json(characters);
                    }
                });
                */

                module.exports = app;
                
            });        
        };
    };
};