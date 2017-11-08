// Dependencies
var express = require("express");
var csvParser = require("csvtojson");
var bodyParser = require("body-parser");
var path = require("path");
var fs = require("fs");
var glob = require("glob");

// Express app setup
var app = express();
var PORT = process.env.PORT || 3000;

// instantiate global vars
var testers_data = []; // global arr, has obj.s for testers

app.use(express.static(__dirname + '/public')); // serve static files
app.use(function (req, res, next) {

    // declare new class, model for indv. tester
    class Tester {
        constructor(id, name, country, devices) {
            this.id = id;
            this.name = name;
            this.country = country;
            this.devices = devices;
        };
    };    

    // required csv files to parse
    var csvfiles_req = {
        bugs: 'csv/bugs.csv',
        devices: 'csv/devices.csv',
        tester_device: 'csv/tester_device.csv',
        testers: 'csv/testers.csv'
    };

    // get list of csv files
    var csvfiles = glob.sync('csv/*.csv');
    
    // now have list of csv files;
    // csv files = ['bugs.csv',...,'testers.csv']

    // scan csv files, construct each indv. tester
        // first scan testers.csv
            // for each row of testerId
                // construct an indv. tester from Tester class w. prop. of id = current row (1,2,3,..,9)
                    // prop. of name = current row from column firstName + lastName
                    // prop. of country = current row from column country
        // scan 
    for (i=0; i < csvfiles.length; i++) {
        if (csvfiles[i] == csvfiles_req.testers) {
            console.log('testers.csv found \n tester ids: \n');

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
    
    next()
});

// Express app data parsing setup
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

// Basic route that sends the user first to the AJAX Page
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

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