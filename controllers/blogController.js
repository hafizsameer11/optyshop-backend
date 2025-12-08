const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { blogArticles: fallbackBlogArticles } = require('../data/dynamicContent');

const toBlogResponse = (item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  category: item.category,
  date: item.date || item.published_at,
  snippet: item.snippet,
  readTime: item.readTime || item.read_time,
  headerImage: item.headerImage || item.header_image,
  keyPoints: item.keyPoints || item.key_points || [],
  summary: item.summary,
  content: item.content
});

const fetchFromDb = async () => {
  try {
    return await prisma.blogArticle.findMany({
      where: { is_published: true },
      orderBy: { published_at: 'desc' }
    });
  } catch (err) {
    console.warn('BlogArticle table not ready, using fallback data. Details:', err.message);
    return [];
  }
};

// @route   GET /api/blog
// @access  Public
exports.getBlogArticles = asyncHandler(async (req, res) => {
  const records = await fetchFromDb();
  const source = records.length ? records : fallbackBlogArticles;
  return success(res, 'Blog articles retrieved successfully', source.map(toBlogResponse));
});

// @route   GET /api/blog/:slug
// @access  Public
exports.getBlogArticleBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  let record = null;

  try {
    record = await prisma.blogArticle.findUnique({ where: { slug } });
  } catch (err) {
    console.warn('BlogArticle lookup failed, will try fallback. Details:', err.message);
  }

  if (!record) {
    record = fallbackBlogArticles.find((article) => article.slug === slug);
  }

  if (!record) {
    return error(res, 'Blog article not found', 404);
  }

  return success(res, 'Blog article retrieved successfully', toBlogResponse(record));
});


