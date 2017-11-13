var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var testerSchema = new Schema({
  testerId: Number,
  firstName: String,
  lastName: String,
  Country: String,
  Devices: {
      cntDroidDNA: Number,
      cntDroidRazor: Number,
      cntGalaxyS3: Number,
      cntGalaxyS4: Number,
      cntHtcOne: Number,
      cntIPhone3: Number,
      cntIphone4: Number,
      cntIphone4s: Number,
      cntIPhone5: Number,
      cntNexus4: Number
  }
});

module.exports = mongoose.model('Tester', testerSchema);