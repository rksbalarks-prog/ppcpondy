const express = require('express');
const router = express.Router();
const { addProperty } = require('./propertyController');

router.post('/add-property-plan-with-datas', addProperty);


module.exports = router;
