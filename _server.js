// Dependencies
var express = require("express");
var csvParser = require("csvtojson");
var bodyParser = require("body-parser");
var path = require("path");
var fs = require("fs");
var glob = require("glob");
var tester = require('./models/tester');

// Express app setup
var app = express();
var PORT = process.env.PORT || 3000;
var router = express.Router();

// instantiate global vars
/*
var testers_data = []; // global arr, has obj.s for testers

// parse csv files, send testers data
app.use(function (req, res, next) {
    
    console.log(req);
    var json = {
        lorem: 'ipsum',
        test: 'test'
    };

    res.send(json)
    console.log(res);
*/
    // declare new class, model for indv. tester
    /*
    class Tester {
        constructor(id, name, country, devices) {
            this.id = id;
            this.name = name;
            this.country = country;
            this.devices = devices;
        };
    };    
    */
    //next();
//});

/*
app.use(express.static(__dirname + '/public')); // serve static files
app.get("/", function(req, res) { // Basic route that sends the user first to the AJAX Page
    console.log('request: /n' + req);
  res.sendFile(path.join(__dirname, "index.html"));
});
*/
//, function );
/*
app.use(function csvParser (req, res, next) {

});
    // instantiate arrays for props. in each indv. tester obj.
    /*
    var ids = [];
    var names = [];
    var countries = [];
    var devices = [];
    */

    // these are changing arrays as data is parsed, to be pushed 
  /*
    var parsed_ids = [];
    var parsed_names = [];
    var parsed_countries = [];
    var parsed_devices = [];

    // required csv files to parse
    const csvfiles_req = {
        testers: 'csv/testers.csv',
        bugs: 'csv/bugs.csv',
        devices: 'csv/devices.csv',
        tester_device: 'csv/tester_device.csv'
    };

    // get list of csv files
    var csvfiles = glob.sync('csv/*.csv');
    
    // arrays
    var ids = function ids(parsed_ids){
        return parsed_ids;
    };

    // now have list of csv files; csv files = ['bugs.csv',...,'testers.csv']
    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] == csvfiles_req.testers) {

            console.log(' found csv/testers.csv \n ... \n getting ids. \n');
            
            // parse data, push to ids array 
            csvParser().
            fromFile(csvfiles_req.testers)
            .on('json',(jsonObj)=>{
                // for each id, push to ids array
                parsed_ids.push(jsonObj.testerId);
            })
            .on('error',(err)=>{
                console.log('error: ' + err)
            })
            .on('done',()=>{
                console.log(parsed_ids);
            });
        } else {
            continue;
        };
    };

    console.log(ids);



    // scan csv files, construct each indv. tester
        // first scan testers.csv
            // for each row of testerId
                // construct an indv. tester from Tester class w. prop. of id = current row (1,2,3,..,9)
                    // prop. of name = current row from column firstName + lastName
                    // prop. of country = current row from column country
        // scan 
    
    /*
    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] == csvfiles_req.testers) {
            csvParser().
            fromFile(csvfiles_req.testers)
            .on('json',(jsonObj)=>{
                // this should output the column testerId's content
                console.log(jsonObj.testerId);
            })
            .on('done',(error)=>{
                console.log('end')
            })
        } else if (csvfiles[i] == csvfiles_req.bugs) {
            console.log('bugs.csv found');
        } else if (csvfiles[i] == csvfiles_req.devices) {
            console.log('devices.csv found');
        } else if (csvfiles[i] == csvfiles_req.tester_device) {
            console.log('tester_device.csv found');
        } else {
            break;
        };
    };

    //console.log('completed');
    */
/*
    next()
});*/

// Express app data parsing setup
/*
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// Data

// Star Wars Characters (DATA)
// =============================================================
var characters = [{
  routeName: "yoda",
  name: "Yoda",
  role: "Jedi Master",
  age: 900,
  forcePoints: 2000
}, {
  routeName: "darthmaul",
  name: "Darth Maul",
  role: "Sith Lord",
  age: 200,
  forcePoints: 1200
}, {
  routeName: "obiwankenobi",
  name: "Obi Wan Kenobi",
  role: "Jedi Master",
  age: 55,
  forcePoints: 1350
}];

// Routes
// =============================================================



app.get("/add", function(req, res) {
  res.sendFile(path.join(__dirname, "add.html"));
});

app.get("/all", function(req, res) {
  res.sendFile(path.join(__dirname, "all.html"));
});

// Search for Specific Character (or all characters) - provides JSON
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

// Create New Characters - takes in JSON input
app.post("/api/new", function(req, res) {
  var newcharacter = req.body;
  newcharacter.routeName = newcharacter.name.replace(/\s+/g, "").toLowerCase();
  console.log(newcharacter);
  characters.push(newcharacter);
  res.json(newcharacter);
});

// Starts the server to begin listening
// =============================================================
app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});
*/