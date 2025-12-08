const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { caseStudies: fallbackCaseStudies } = require('../data/dynamicContent');

const toCaseStudyResponse = (item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  heroTitle: item.hero_title || item.heroTitle,
  heroSubtitle: item.hero_subtitle || item.heroSubtitle,
  category: item.category,
  person: item.person,
  image: item.image_url || item.image,
  content: item.content,
  tags: item.tags || []
});

const fetchFromDb = async () => {
  try {
    return await prisma.caseStudy.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' }
    });
  } catch (err) {
    console.warn('CaseStudy table not ready, using fallback data. Details:', err.message);
    return [];
  }
};

// @route   GET /api/case-studies
// @access  Public
exports.getCaseStudies = asyncHandler(async (req, res) => {
  const records = await fetchFromDb();
  const source = records.length ? records : fallbackCaseStudies;
  return success(res, 'Case studies retrieved successfully', source.map(toCaseStudyResponse));
});

// @route   GET /api/case-studies/:slug
// @access  Public
exports.getCaseStudyBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  let record = null;

  try {
    record = await prisma.caseStudy.findUnique({ where: { slug } });
  } catch (err) {
    console.warn('CaseStudy lookup failed, will try fallback. Details:', err.message);
  }

  if (!record) {
    record = fallbackCaseStudies.find((c) => c.slug === slug);
  }

  if (!record) {
    return error(res, 'Case study not found', 404);
  }

  return success(res, 'Case study retrieved successfully', toCaseStudyResponse(record));
});


