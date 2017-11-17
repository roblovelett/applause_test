var fs = require('fs');
var path = require('path');
var glob = require('glob');
var csvParser = require('fast-csv');

// required csv files to parse
const csvfiles_req = {
    testers: '../csv/testers.csv',
    bugs: '../csv/bugs.csv',
    devices: '../csv/devices.csv',
    tester_device: '../csv/tester_device.csv'
};

// csv parser
const csvfiles = glob.sync('../csv/*.csv'); // get list of csv files
var db = [];

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
                console.log('Cannot find testers.csv. Required to create database.');        
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
                console.log('Done. \n')
                for (i=0; i < db.length; i++) {                  
                    db[i].Devices = Object.assign({}, Devices);
                    continue;
                };
                
                if (i+1 === csvfiles.length) {
                    console.log('Cannot find devices.csv. Required to create database.');        
                };

                getBugCount(stream, db);
            
            });
        };     
    };
};

var getBugCount = (stream, db) => {
    
    var deviceId_db;
    var testerId_db;
    var deviceId_parsed;
    var testerId_parsed;
    var matchedTesterId;
    var matchedTester;
    var matchedDevice;
    var devicesNum = (db) => {
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
                        console.log('testerId_db match: ' + testerId_db);
                        // seems testerId_db was string, conv. to # 
                        // find proper num tester obj. in db array 
                        // - 1 since array starts 0
                        matchedTester = db[Number(testerId_db) - 1];
                        // find parsed deviceId in Tester obj. add to bugCount
                        matchedDevice = matchedTester.Devices[deviceId_parsed];
                        matchedDevice.bugCount ++;
                    };
                    //finish updating bugCount for matchedTester
                };
            })
            .on("end", () => {
                if (i+1 === csvfiles.length) {
                    console.log('Cannot find bugs.csv. Required to create database. \n');        
                };
                // export db
                module.exports = db;
            });        
        };
    };
};