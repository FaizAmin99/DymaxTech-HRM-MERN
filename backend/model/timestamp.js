const mongoose = require('mongoose');

const timestampSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
});

Timestamp = mongoose.model('Timestamp', timestampSchema);

module.exports = Timestamp;
