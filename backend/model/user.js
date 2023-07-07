var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSchema = new Schema( {
	username: String,
	password: String
}),
user = mongoose.model('user', userSchema);

module.exports = user;
















// ------------------- Express --------------------
const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

const url = 'mongodb+srv://faiz123:faiz123@clusterfaiz.qupdcy6.mongodb.net/hrm_data';
const dbName = 'hrm-data';

MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
	if (err) throw err;

	const db = client.db(dbName);

	app.listen(port, () => {
		console.log('Server running on port ${port}');
	});
});





// ------------------- Nodejs --------------------
app.get('/api/timestamp', (req, res) => {
	const collection = db.collection('employees');

	collection.findOne({}, {sort: { $natural: -1 }}, (err, result) => {
	 if (err) throw err;
	 
	 res.json(result.timestamp);
	} );
});




// ------------------- React --------------------
import React, { useEffect, useState } from 'react';

const TimestampComponent = () => {
	const [timestamp, setTimestamp] = useState('');

	useEffect(() => {
		fetch('/api/timestamp')
		.then(response => response.json())
		.then(data => setTimestamp(data))
		.catch(error => console.log(error));
	}, []);

	return (
		<div> 
			<h1>Timestamp: {timestamp}</h1>
		</div>
	);
};

export default TimestampComponent;