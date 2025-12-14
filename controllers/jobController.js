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

// ==================== ADMIN ROUTES ====================

// @route   GET /api/admin/jobs
// @access  Private/Admin
exports.getAllJobsAdmin = asyncHandler(async (req, res) => {
  const jobs = await prisma.job.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      applications: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          created_at: true
        }
      }
    }
  });
  return success(res, 'Jobs retrieved successfully', { jobs });
});

// @route   GET /api/admin/jobs/:id
// @access  Private/Admin
exports.getJobAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await prisma.job.findUnique({
    where: { id: parseInt(id) },
    include: {
      applications: true
    }
  });

  if (!job) {
    return error(res, 'Job not found', 404);
  }

  return success(res, 'Job retrieved successfully', { job });
});

// @route   POST /api/admin/jobs
// @access  Private/Admin
exports.createJob = asyncHandler(async (req, res) => {
  const { title, department, location, description, requirements, apply_url, is_active } = req.body;

  if (!title) {
    return error(res, 'Job title is required', 400);
  }

  const data = {
    title,
    department: department || null,
    location: location || null,
    description: description || null,
    apply_url: apply_url || null,
    is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : true
  };

  // Generate slug from title if not provided
  if (!req.body.slug) {
    data.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  } else {
    data.slug = req.body.slug;
  }

  // Handle requirements - convert to JSON string if it's an object or array
  if (requirements !== undefined) {
    if (typeof requirements === 'object' && requirements !== null) {
      data.requirements = JSON.stringify(requirements);
    } else if (typeof requirements === 'string') {
      // Try to validate it's valid JSON
      try {
        JSON.parse(requirements);
        data.requirements = requirements; // Already valid JSON string
      } catch {
        // If not valid JSON, wrap it
        data.requirements = JSON.stringify({ text: requirements });
      }
    } else {
      data.requirements = null;
    }
  }

  const job = await prisma.job.create({ data });
  return success(res, 'Job created successfully', { job }, 201);
});

// @route   PUT /api/admin/jobs/:id
// @access  Private/Admin
exports.updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, department, location, description, requirements, apply_url, is_active, slug } = req.body;

  // Check if job exists
  const existingJob = await prisma.job.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingJob) {
    return error(res, 'Job not found', 404);
  }

  const data = {};

  if (title !== undefined) {
    data.title = title;
    // Regenerate slug if title changed and slug not explicitly provided
    if (!slug && title !== existingJob.title) {
      data.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
  }

  if (slug !== undefined) {
    data.slug = slug;
  }

  if (department !== undefined) data.department = department || null;
  if (location !== undefined) data.location = location || null;
  if (description !== undefined) data.description = description || null;
  if (apply_url !== undefined) data.apply_url = apply_url || null;

  // Convert string booleans to actual booleans
  if (is_active !== undefined) {
    data.is_active = is_active === 'true' || is_active === true;
  }

  // Handle requirements - convert to JSON string if it's an object or array
  if (requirements !== undefined) {
    if (typeof requirements === 'object' && requirements !== null) {
      data.requirements = JSON.stringify(requirements);
    } else if (typeof requirements === 'string') {
      // Try to validate it's valid JSON
      try {
        JSON.parse(requirements);
        data.requirements = requirements; // Already valid JSON string
      } catch {
        // If not valid JSON, wrap it
        data.requirements = JSON.stringify({ text: requirements });
      }
    } else if (requirements === null || requirements === '') {
      data.requirements = null;
    }
  }

  const job = await prisma.job.update({
    where: { id: parseInt(id) },
    data
  });

  return success(res, 'Job updated successfully', { job });
});

// @route   DELETE /api/admin/jobs/:id
// @access  Private/Admin
exports.deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if job exists
  const existingJob = await prisma.job.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingJob) {
    return error(res, 'Job not found', 404);
  }

  await prisma.job.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Job deleted successfully');
});

// ==================== JOB APPLICATION MANAGEMENT ====================

// @route   GET /api/admin/job-applications
// @access  Private/Admin
exports.getAllJobApplications = asyncHandler(async (req, res) => {
  const { status, job_id } = req.query;
  
  const where = {};
  if (status) {
    // Validate status is one of the allowed enum values
    if (['pending', 'accepted', 'rejected'].includes(status)) {
      where.status = status;
    }
  }
  if (job_id) {
    where.job_id = parseInt(job_id);
  }

  const applications = await prisma.jobApplication.findMany({
    where,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          location: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Job applications retrieved successfully', { applications });
});

// @route   GET /api/admin/job-applications/:id
// @access  Private/Admin
exports.getJobApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const application = await prisma.jobApplication.findUnique({
    where: { id: parseInt(id) },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          location: true,
          description: true
        }
      }
    }
  });

  if (!application) {
    return error(res, 'Job application not found', 404);
  }

  return success(res, 'Job application retrieved successfully', { application });
});

// @route   PUT /api/admin/job-applications/:id/accept
// @access  Private/Admin
exports.acceptJobApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.user?.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: parseInt(id) }
  });

  if (!application) {
    return error(res, 'Job application not found', 404);
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: parseInt(id) },
    data: {
      status: 'accepted',
      notes: notes || null,
      reviewed_at: new Date(),
      reviewed_by: userId || null
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          location: true
        }
      }
    }
  });

  return success(res, 'Job application accepted successfully', { application: updatedApplication });
});

// @route   PUT /api/admin/job-applications/:id/reject
// @access  Private/Admin
exports.rejectJobApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.user?.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: parseInt(id) }
  });

  if (!application) {
    return error(res, 'Job application not found', 404);
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: parseInt(id) },
    data: {
      status: 'rejected',
      notes: notes || null,
      reviewed_at: new Date(),
      reviewed_by: userId || null
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          location: true
        }
      }
    }
  });

  return success(res, 'Job application rejected successfully', { application: updatedApplication });
});

// @route   PUT /api/admin/job-applications/:id/status
// @access  Private/Admin
exports.updateJobApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user?.id;

  if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
    return error(res, 'Invalid status. Must be one of: pending, accepted, rejected', 400);
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: parseInt(id) }
  });

  if (!application) {
    return error(res, 'Job application not found', 404);
  }

  const updateData = {
    status,
    reviewed_at: new Date(),
    reviewed_by: userId || null
  };

  if (notes !== undefined) {
    updateData.notes = notes || null;
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          location: true
        }
      }
    }
  });

  return success(res, 'Job application status updated successfully', { application: updatedApplication });
});

// @route   DELETE /api/admin/job-applications/:id
// @access  Private/Admin
exports.deleteJobApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await prisma.jobApplication.findUnique({
    where: { id: parseInt(id) }
  });

  if (!application) {
    return error(res, 'Job application not found', 404);
  }

  await prisma.jobApplication.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Job application deleted successfully');
});


