const express = require('express');
const { getFormConfig, submitForm } = require('../controllers/formController');

const router = express.Router();

router.get('/:name', getFormConfig);
router.post('/:name/submissions', submitForm);

module.exports = router;


