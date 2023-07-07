const mongoose = require('mongoose');

const timestampSchema = new mongoose.Schema({
  timestamp: { 
    type: Date,
    required: true },
});



module.exports = mongoose.model('Timestamp', timestampSchema);