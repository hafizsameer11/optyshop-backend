const express = require('express');
const { getCaseStudies, getCaseStudyBySlug } = require('../controllers/caseStudyController');

const router = express.Router();

router.get('/', getCaseStudies);
router.get('/:slug', getCaseStudyBySlug);

module.exports = router;


