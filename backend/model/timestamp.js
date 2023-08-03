const mongoose = require('mongoose');
var Schema = mongoose.Schema;

timestampSchema = new Schema({
  timestamp: { 
    type: Date,
    required: true },

  timestamp_out: { 
    type: Date
  },
  user: {
    type: String,
    required: true
  },

  status: { 
    type: String, 
    enum: ['On Time' , 'Late' , 'Overtime'], 
    default: 'On Time'}
  
});



module.exports = mongoose.model('Timestamp', timestampSchema);