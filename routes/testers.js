var Tester = require('../models/tester');
var express = require('express');
var router = express.Router();

router.route('/testers').get((req, res) => {
    Tester.find((err, testers) => {
        if (err) {
            return res.send(err);
        };
        res.json(testers);
    });
}).post((req, res) => {
    var tester = new Tester(req.body);
    tester.save((err) => {
      if (err) {
        return res.send(err);
      };
      res.send({ message: 'Tester Added.' });
    });
});

router.route('/testers/:id').get((req, res) => {
    Tester.findOne({ _id: req.params.id}, function(err, tester) {
        if (err) {
            return res.send(err);
        };
        res.json(tester);
    });
});

module.exports = router;