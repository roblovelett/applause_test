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
                deviceName = deviceName.replace(/\s+/g, ''); // trim whitespace
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
                    db[i].Devices = JSON.parse(JSON.stringify(Devices)); // Deep Clone
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

                var totalBugCount = 0; // total bug count per tester; init 0

                for (t=0; t < testersNum; t++) { // search thru testers
                    for (d=1; d <= devicesNum; d++) { // search thru each testers devices
                        totalBugCount = totalBugCount + db[t].Devices[d].bugCount;
                    };
                    db[t].totalBugCount = totalBugCount; // set totalBugCount for each tester
                    totalBugCount = 0;
                };
                
                // routes setup
                app.get('/', (req, res) => {
                    console.log('get http://localhost:8000');
                    res.sendFile(path.join(__dirname, "index.html")); // serve index.html
                })

                app.get('/api', (req, res) => {
                    res.json({message: 'This is the Testers API. Example: "/api/countries/country01&country02/devices/device01&device02"'});
                });
                
                app.get('/api/countries/:countries_req/devices/:devices_req', (req, res) => {
                    
                    var countries_req = req.params.countries_req; // req. countries in api
                    var devices_req = req.params.devices_req; // req. devices in api
                    var devices_req_num; // # of devices req. in api
                    var current_device_req;
                    var current_tester;
                    var current_device_name;
                    var db_res = db; // data sorted from orig. db, put in db res. obj, conditional
                    var valid_cntr = 0; // counter checks # of valid countries/devices
                    var valid = false; // bool checks countries/devices valid

                    if (countries_req && devices_req) {
                        if (countries_req === 'all' && devices_req === 'all') {
                            db_res = _.orderBy(db, 'totalBugCount', 'desc'); // sort by highest bugCount
                        } else if (countries_req === 'all' && devices_req != 'all') {
                            devices_req = _.split(devices_req, '&'); // parse devices_req api string, rem. &s
                            devices_req_num = devices_req.length; // get # of items in devices_req arr
                            for (r=0; r < devices_req_num; r++) {
                                for (d=0; d < devicesNum; d++) {
                                    if (devices[d] === devices_req[r]) {
                                        valid_cntr++;
                                    };
                                };
                                if (valid_cntr === devices_req_num) {
                                    valid = true;
                                    break;
                                };
                            };

                            console.log('devices_req: ' + devices_req + 'devices_req_num: ' + devices_req_num);
                            console.log(db_res[0].Devices[1].name);
                            console.log(devices_req[0]);

                            if (valid) {    
                                //res.send('devicesNum: ' +  devicesNum + 'devices_req: ' + devices_req + 'devices_req_num: ' + devices_req_num + 'valid_cntr: ' + valid_cntr + 'valid: ' + valid);
                                
                                for (r=0; r < devices_req_num; r++) {
                                    current_device_req = devices_req[r];
                                    for (t=0; t < testersNum; t++) {
                                        current_tester = db_res[t];
                                        for (d=1; d <= devicesNum; d++) {
                                            current_device = current_tester.Devices[d];
                                            if (current_device.name === current_device_req) {
                                                //match
                                            } else {
                                                current_device.bugCount = 0;
                                                db_res[t].Devices[d].bugCount = JSON.parse(JSON.stringify(current_device.bugCount));
                                            };
                                        };
                                    };
                                };

                                res.send(db_res);

                            } else {
                                //res.send('Error: Invalid devices.');
                            };
                        };
                    };
                });

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
                                    
                                    /*
                                    for (i=0; i < db_res.length; i++) { // search each tester
                                        for (d=1; d <= devicesNum; d++) { // search devices each tester
                                            for (n=0; n < devices_req.length; n++) { // search devices req in devices each tester
                                                res.send(devices_req[n]);
                                                currentDeviceName = db_res[i].Devices[d].name; // get current device name
                                                if (currentDeviceName != devices_req[n]) {
                                                    // (needed to update total bugCount considering devices req)
                                                    db_res[i].Devices[d].bugCount = 0;
                                                };  
                                            };
                                        };
                                    };
                                    */

                                    // sort testers by bugCount desc. order

                                    /*
                                    for (i=0; i < db_res.length; i++) { // search db
                                        for (d=0; d < devicesNum; d++) { // search devices
                                            // find matching device for device req.
                                            for (r=0; r < devices_req.length; r++) {
                                                // if match & bugCount = 0
                                                if (db_res[i].Devices[d].name === devices_req[r] && db_res[i].Devices[d].bugCount < 1 ) {
                                                    untested_cntr++;
                                                    db_res[i].untestedCount = untested_cntr;
                                                };
                                            };
                                        };
                                    };*/
                                //};  
                            //};
                        //};
                    //};
                //});           
/*
                                    var array = ['a', 'b', 'c', 'a', 'b', 'c']; 
                                    _.pull(array, 'a', 'c');
                                    console.log(array);
                                    // => ['b', 'b']
                                */

                                //check devices_req valid
                                //iPhone4,iPhone4S,iPhone5,GalaxyS3,GalaxyS4,Nexus4,DroidRazor,DroidDNA,HTCOne,iPhone3


                                //res.json('all/*');
                            /*
                            } else if (countries_req != 'all' && devices_req === 'all') {
                                res.json(*///'*/all');
                            /*};
                        } else {
                            res.json(false);
                        };*/
                        //res.json(characters[i]);
                        //return;
                        //};
                    
                        //};
                
                        //});

                // app setup
                /*
                app.use(bodyParser.json({ extended: true }));
                app.use(bodyParser.urlencoded({ extended: true }));
                app.use(bodyParser.text({ extended: true }));
                app.use(bodyParser.json({ type: "application/vnd.api+json", extended: true }));
                */

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