const express = require('express');
const { getFormConfig, submitForm } = require('../controllers/formController');
const { uploadSupportAttachments } = require('../middleware/upload');

const router = express.Router();

router.get('/:name', getFormConfig);

// Support form with file uploads
router.post('/support/submissions', uploadSupportAttachments('attachments'), submitForm);

// All other forms
router.post('/:name/submissions', submitForm);

module.exports = router;


