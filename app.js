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
    };
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
    var testers = db.map(tester => tester.firstName + tester.lastName);
    var testersNum = db.length; // # of testers in db; need for api
    var devices = getDevices(db);
    var devicesNum = devices.length; //getDevicesNum(db);
    var countries = getCountries(db);
    var countriesNum = countries.length;
    
    //helper functions
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
                    var db_res = []; // data sorted from orig. db, put in db res. obj, conditional
                    var valid = false; // bool checks countries/devices valid
                    var countries_req_num;
                    var devices_req_num;

                    switch (true) {
                        case (countries_req && devices_req):
                            countries_req = parseReq(countries_req);
                            devices_req = parseReq(devices_req);
                            valid = validateReqs(countries_req, devices_req);
                        case (valid):
                            valid = false; // reset
                            db_res = createDb(countries_req);
                            res.send(db_res); // send db
                            break;
                        default:
                            res.send('Error. Cannot create Database.')
                    };

                    console.log(valid);
                    console.log(countries_req + devices_req);
                    
                    function parseReq (req) {
                        var hasCountries = false; // bool to check if req has countries
                        var hasDevices = false; // bool to check if req has devices
                        var req_arr = []; // empty arr push api reqs to, return
                        
                        switch (true) {
                            case checkHasCountries:
                                for (c=0; c < countriesNum; c++) {
                                    if (req.includes(countries[c])){
                                        hasCountries = true;
                                    };
                                };
                            case checkHasDevices:
                                for (d=0; d < devicesNum; d++) {
                                    if(req.includes(devices[d])){
                                        hasDevices = true;
                                    };
                                };
                            case (hasCountries || hasDevices):
                                switch (true) {
                                    case (req.includes('&')):
                                        req_arr = _.split(req, '&'); // split req api string, rem. &s, store arr
                                        break;    
                                    case (req === 'all'):
                                        req_arr = req;
                                        break; 
                                    default:
                                        req_arr.push(req);
                                };
                                break;
                            default:
                                res.send('Invalid Countries &/ Devices.')
                        };
                        return req_arr;
                    };

                    function validateReqs (req_cntry, req_dev) {
                        var valid_cntr = 0;
                        var cntry_valid = false;
                        var dev_valid = false;
                        var all_valid = false;
                        var validate_msg = '';
                        
                        switch (true) {
                            case (hasCountries):
                                hasCountries = false; // reset
                                countries_req_num = req_cntry.length; // get # of items in countries_req arr
                                for (r=0; r < countries_req_num; r++) {
                                    for (c=0; c < countriesNum; c++) {
                                        if (countries[c] === req_cntry[r]) {
                                            valid_cntr++;
                                        };
                                    };
                                    if (valid_cntr === countries_req_num || req_cntry === 'all') {
                                        valid_cntr = 0;
                                        cntry_valid = true;
                                        break;
                                    } else {
                                        validate_msg = 'Invalid Country or Countries. '
                                    };
                                };
                            case (hasDevices):
                                hasDevices = false; // reset
                                devices_req_num = req_dev.length; // get # of items in devices_req arr
                                for (r=0; r < devices_req_num; r++) {
                                    for (d=0; d < devicesNum; d++) {
                                        if (devices[d] === req_dev[r]) {
                                            valid_cntr++;
                                        };
                                    };
                                    if (valid_cntr === devices_req_num || req_cntry === 'all') {
                                        valid_cntr = 0;
                                        dev_valid = true;
                                        break;
                                    } else {
                                        validate_msg = validate_msg + 'Invalid Device(s).'
                                    };
                                };
                            case (cntry_valid && dev_valid):
                                all_valid = true;
                                break;
                            default:
                                res.send(validate_msg); // error msg
                        };
                        return all_valid;
                    };

                    function createDb(cntry_req, dev_req) {
                        var db_res = [];
                        var current_tester;
                        var current_country;
                        var current_device;
                        var device_checked = false;
                        var apiTestersNum = 0; // num of testers req based on api req; init

                        switch (true) {
                            case (cntry_req === 'all'):
                                db_res =db;
                            case create_db:
                                for (t=0; t < testersNum; t++) {
                                    current_tester = db[t];
                                    for (r=0; r < countries_req_num; r++) {
                                        current_country = current_tester.Country;
                                        if (current_country === countries_req[r]) {
                                            db_res.push(current_tester);
                                        };
                                    };
                                };
                                apiTestersNum = db_res.length; // get num of testers based on api req 
                            case (dev_req === 'all'):
                                db_res = sortDb(db_res);
                                return db_res;
                                break;
                            case remove_unrequested_devices:        
                                for (t=0; t < apiTestersNum; t++) {
                                    current_tester = db_res[t];
                                    for (d=1; d <= devicesNum; d++) {
                                        current_device = current_tester.Devices[d];
                                        for (r=0; r < devices_req_num; r++) {
                                            device_checked = false;
                                            if (current_device.name === devices_req[r]) {
                                                device_checked = true;
                                                break;
                                            };
                                        };
                                        if (!device_checked) {
                                            db_res[t].totalBugCount = db_res[t].totalBugCount - current_device.bugCount;
                                            db_res[t].Devices[d].bugCount = 0;
                                        };
                                    };
                                };
                                db_res = sortDb(db_res);
                                return db_res;
                                break;
                            default:
                                res.send('Error. Unable to create Database.');
                        };
                    };

                    function sortDb(db_res) {
                        db_res = _.orderBy(db_res, 'totalBugCount', 'desc'); // sort by highest bugCount
                        return db_res;
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