const express = require('express');
const { getBlogArticles, getBlogArticleBySlug } = require('../controllers/blogController');

const router = express.Router();

router.get('/', getBlogArticles);
router.get('/:slug', getBlogArticleBySlug);

module.exports = router;


