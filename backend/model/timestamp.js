const mongoose = require('mongoose');
var Schema = mongoose.Schema;

timestampSchema = new Schema({
  timestamp: { 
    type: Date,
    required: true },

    timestamp_out: { 
      type: Date,
      required: true },
  
});



module.exports = mongoose.model('Timestamp', timestampSchema);