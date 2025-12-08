const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { jobs: fallbackJobs } = require('../data/dynamicContent');

const toJobResponse = (item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  department: item.department,
  location: item.location,
  description: item.description,
  requirements: item.requirements || [],
  applyUrl: item.apply_url || item.applyUrl,
  isActive: item.is_active !== undefined ? item.is_active : item.isActive
});

const fetchFromDb = async () => {
  try {
    return await prisma.job.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    });
  } catch (err) {
    console.warn('Job table not ready, using fallback data. Details:', err.message);
    return [];
  }
};

// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  const records = await fetchFromDb();
  const source = records.length ? records : fallbackJobs;
  return success(res, 'Jobs retrieved successfully', source.map(toJobResponse));
});

// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumericId = /^\d+$/.test(id);
  let record = null;

  try {
    record = isNumericId
      ? await prisma.job.findUnique({ where: { id: parseInt(id, 10) } })
      : await prisma.job.findUnique({ where: { slug: id } });
  } catch (err) {
    console.warn('Job lookup failed, will try fallback. Details:', err.message);
  }

  if (!record) {
    record = fallbackJobs.find((job) => job.id === Number(id) || job.slug === id);
  }

  if (!record) {
    return error(res, 'Job not found', 404);
  }

  return success(res, 'Job retrieved successfully', toJobResponse(record));
});


