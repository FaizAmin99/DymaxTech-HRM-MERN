var express = require('express');
var
 router = express.Router();
var Timestamp= require('../model/timestamp');

router.get('/', async (req, res) => {
    try {
        const timestamps = await Timestamp.find();
        res.json(timestamps);
    } catch (error) {
        console.error('Error fetching timestamps:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;