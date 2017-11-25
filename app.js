var express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
//var testers = require('./routes/testers'); //routes are defined here
var fs = require('fs');
var glob = require('glob');
var csvParser = require('fast-csv');
var _ = require('lodash'); // needed for deduping
var app = express(); // using for restful api

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
    
    var deviceId_parsed;
    var testerId_parsed;
    
    const testersNum = db.length; // # of testers in db; need for api    
    const devicesNum = getDevicesNum(db);
    const testers = db.map(tester => tester.firstName + tester.lastName);
    const countries = getCountries(db);
    const devices = getDevices(db);
    
    //helper functions
    function getDevicesNum (db) {
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
    
    function getCountries(db) {
        var countries = [];
        var country;
        for (i=0; i < db.length; i++){
            country = db[i].Country;
            countries[i] = country;
        };
        countries = _.uniq(countries); // using lodash to dedupe
        return countries;
    };
    
    function getDevices (db) {
        var devices = []; // init array of devices
        var device;
        for (i=0; i < devicesNum; i++) { // scan Devices, put in devices array
            // db array starts @ 0; Devices props start @ 1;
            device = db[testersNum - 1].Devices[i + 1].name;
            device = device.replace(/\s/g, '');
            devices[i] = device;
        };
        return devices;
    };

    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] === csvfiles_req.bugs) {
            console.log('bugs.csv found. Parsing...');
            stream = fs.createReadStream(csvfiles_req.bugs);
            csvParser
            .fromStream(stream, {headers: [,"deviceId","testerId"]})
            .on("data", (data) => {
                
                testerId_parsed = data.testerId; // make sure parsed as #
                deviceId_parsed = Number(data.deviceId); // make sure parsed as #
                
                // find  testerId_parsed in db
                for (d=0; d < db.length; d++) {
                    if (testerId_parsed === db[d].testerId) {
                        db[d].Devices[deviceId_parsed].bugCount ++; // add to device's bug count
                    };
                };
            })
            .on("end", () => {
                if (i+1 === csvfiles.length) {
                    throw new Error('Cannot find bugs.csv. Required to create database.');        
                };
          
                console.log(db[0].Devices);
                console.log(db[1].Devices);
                console.log(db[2].Devices);
                console.log(db[3].Devices);
                console.log(db[4].Devices);
                console.log(db[5].Devices);
                console.log(db[6].Devices);
                console.log(db[7].Devices);
                console.log(db[8].Devices);
                
                // routes setup
                app.get('/', (req, res) => {
                    console.log('get http://localhost:8000');
                    res.sendFile(path.join(__dirname, "index.html")); // serve index.html
                })

                app.get('/api', (req, res) => {
                    res.json({message: 'This is the Testers API. Example: "/api/countries/country01&country02/devices/device01&device02"'});
                });
                
                app.get('/api/countries/:countries_req/devices/:devices_req', (req, res) => {
                    //res.json(req.params);

                    var testers_res = db; // clone init. db into testers response obj                     
                    var countries_req = req.params.countries_req; // requested countries in api
                    var devices_req = req.params.devices_req; // requested devices in api
                
                    /*
                    console.log('Done. Database created.');
                    console.log('testersNum: ' + testersNum);
                    console.log('devicesNum: ' + devicesNum);
                    console.log('testers: ' + testers);
                    console.log('devices: ' + devices);
                    */
                    
                    for (i=0; i < testersNum; i++) {
                        if (countries_req && devices_req) {
                            if (countries_req === 'all' && devices_req === 'all') {
                                res.json(testers_res);        
                            } else if (testers.countries === 'all' && testers.devices != 'all') {
                                res.json('all/*');
                            } else if (testers.countries != 'all' && testers.devices === 'all') {
                                res.json('*/all');
                            }
                        } else {
                            res.json(false);
                        };
                        //res.json(characters[i]);
                        return;
                    };
                });

                // app setup
                /*
                app.use(bodyParser.json({ extended: true }));
                app.use(bodyParser.urlencoded({ extended: true }));
                app.use(bodyParser.text({ extended: true }));
                app.use(bodyParser.json({ type: "application/vnd.api+json", extended: true }));
                */

                // serve static files (public/*; css,js,etc)
                app.use(express.static(__dirname + '/public')); 
                app.set('port', process.env.PORT || 8000); //set port

                var server = app.listen(app.get('port'), function() {
                    console.log('App listening on port ' + server.address().port);
                });                
                
                module.exports = app;

            });        
        };
    };
};

// Find most experienced Tester
/*
app.get('/api/countries/:countries_req/devices/:device_req'), (req, res) => {
    
    // db
    // testersNum
    // devicesNum
    // db_res
    
    var testers_res = db; // clone init. db into testers response obj                     
    var countries_req = req.params.keyName.countries_req; // requested countries in api
    var devices_req = req.params.keyName.devices_req; // requested devices in api

    for (i=0; i < testersNum; i++) {
        if (countries_req && devices_req) {
            if (countries_req === 'all' && devices_req === 'all') {
                res.json('all/all');        
            } else if (testers.countries === 'all' && testers.devices != 'all') {
                /*
                console.log('Done. Database created.');
                console.log('testersNum: ' + testersNum);
                console.log('devicesNum: ' + devicesNum);
                console.log('testers: ' + testers);
                console.log('devices: ' + devices);
                */
                
                //This route path will match butterfly and dragonfly, 
                //but not butterflyman, dragonflyman, and so on.
                /*
                app.get(/.*fly$/, function (req, res) {
                    res.send('/.*fly$/')
                })
                
                
                res.json('all/*');
            } else if (testers.countries != 'all' && testers.devices === 'all') {
                res.json('*//*all');
            }
        } else {
            res.json(false);
        };
        res.json(characters[i]);
        return;
    };
};*/