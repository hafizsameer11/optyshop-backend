const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3, deleteFromS3 } = require('../config/aws');

// ==================== BANNERS ====================

const VALID_PAGE_TYPES = ['home', 'category', 'subcategory', 'sub_subcategory'];

/** Placement slots on a page (header/footer/hero/…). Free-form strings under 50 chars are also accepted. */
const KNOWN_POSITIONS = new Set([
  'header',
  'hero',
  'footer',
  'sidebar',
  'category',
  'top',
  'bottom',
  'main',
  'home',
  'category_section',
  'subcategory_page',
  'sub_subcategory_page',
]);

const bannerInclude = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  subCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      category_id: true,
      parent_id: true,
    },
  },
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

const normalizeIsActive = (value) => {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true || value === '1' || value === 1) return true;
  if (value === 'false' || value === false || value === '0' || value === 0) return false;
  return false;
};

const normalizePosition = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length > 50) return undefined; // invalid
  return trimmed;
};

/**
 * Validate page_type + category / subcategory associations.
 * Returns { ok: true, data } or { ok: false, message, status }.
 */
const validateBannerScope = async (raw, { requireCategoryForScoped = true } = {}) => {
  const page_type = String(raw.page_type || 'home').trim().toLowerCase();
  if (!VALID_PAGE_TYPES.includes(page_type)) {
    return {
      ok: false,
      status: 400,
      message: `Invalid page_type. Must be one of: ${VALID_PAGE_TYPES.join(', ')}`,
    };
  }

  const position = normalizePosition(raw.position);
  if (position === undefined && raw.position !== undefined && String(raw.position).trim() !== '') {
    return { ok: false, status: 400, message: 'Invalid position (max 50 characters)' };
  }
  // Known presets are preferred, but any short string is allowed (footer, custom slots, etc.)
  if (position && !KNOWN_POSITIONS.has(position) && !/^[a-z0-9_\-]+$/i.test(position)) {
    return {
      ok: false,
      status: 400,
      message: 'Invalid banner location / position. Use letters, numbers, underscore or hyphen.',
    };
  }

  let category_id = parseOptionalInt(raw.category_id);
  let sub_category_id = parseOptionalInt(raw.sub_category_id);

  if (page_type === 'home') {
    // Main home hero: no category. Optional category_id is remapped by admin to page_type=category.
    category_id = null;
    sub_category_id = null;
  }

  if (page_type === 'category' || page_type === 'subcategory' || page_type === 'sub_subcategory') {
    if (requireCategoryForScoped && !category_id) {
      return {
        ok: false,
        status: 400,
        message: 'category_id is required for category, subcategory, and sub_subcategory page types',
      };
    }
    if (category_id) {
      const category = await prisma.category.findUnique({ where: { id: category_id } });
      if (!category) {
        return { ok: false, status: 404, message: 'Category not found' };
      }
    }
  }

  if (page_type === 'subcategory' || page_type === 'sub_subcategory') {
    if (requireCategoryForScoped && !sub_category_id) {
      return {
        ok: false,
        status: 400,
        message: 'sub_category_id is required for subcategory and sub_subcategory page types',
      };
    }
    if (sub_category_id) {
      const subCategory = await prisma.subCategory.findUnique({ where: { id: sub_category_id } });
      if (!subCategory) {
        return { ok: false, status: 404, message: 'SubCategory not found' };
      }
      if (category_id && subCategory.category_id !== category_id) {
        return {
          ok: false,
          status: 400,
          message: 'SubCategory does not belong to the specified category',
        };
      }
    }
  } else if (page_type === 'category') {
    sub_category_id = null;
  }

  return {
    ok: true,
    data: {
      page_type,
      position: position === undefined ? undefined : position,
      category_id,
      sub_category_id,
    },
  };
};

const buildBannerListWhere = (query, { activeOnly = false } = {}) => {
  const where = {};
  if (activeOnly) where.is_active = true;

  if (query.page_type) {
    const pageType = String(query.page_type).trim().toLowerCase();
    if (VALID_PAGE_TYPES.includes(pageType)) {
      where.page_type = pageType;
    }
  }

  if (query.position) {
    where.position = String(query.position).trim();
  }

  if (query.category_id !== undefined && query.category_id !== null && query.category_id !== '') {
    where.category_id = parseInt(query.category_id, 10);
  }

  if (query.sub_category_id !== undefined && query.sub_category_id !== null && query.sub_category_id !== '') {
    where.sub_category_id = parseInt(query.sub_category_id, 10);
  }

  return where;
};

// Public version - only active banners with filtering
exports.getBanners = asyncHandler(async (req, res) => {
  const where = buildBannerListWhere(req.query, { activeOnly: true });

  const banners = await prisma.banner.findMany({
    where,
    include: bannerInclude,
    orderBy: { sort_order: 'asc' },
  });

  return success(res, 'Banners retrieved', { banners });
});

// Admin version - all banners with filtering
exports.getBannersAdmin = asyncHandler(async (req, res) => {
  const where = buildBannerListWhere(req.query, { activeOnly: false });

  const banners = await prisma.banner.findMany({
    where,
    include: bannerInclude,
    orderBy: { sort_order: 'asc' },
  });

  return success(res, 'Banners retrieved', { banners });
});

const getBannerUploadFile = (req, fieldName) => {
  const fromFields = req.files?.[fieldName]?.[0];
  if (fromFields) return fromFields;
  if (fieldName === 'image' && req.file) return req.file;
  return null;
};

exports.createBanner = asyncHandler(async (req, res) => {
  const imageFile = getBannerUploadFile(req, 'image');
  if (!imageFile) return error(res, 'Image is required', 400);

  const url = await uploadToS3(imageFile, 'cms/banners');

  const scope = await validateBannerScope(req.body, { requireCategoryForScoped: true });
  if (!scope.ok) return error(res, scope.message, scope.status);

  const cleanData = {
    title: String(req.body.title || '').trim(),
    image_url: url,
    link_url: req.body.link_url ? String(req.body.link_url).trim() : null,
    page_type: scope.data.page_type,
    position: scope.data.position === undefined ? null : scope.data.position,
    category_id: scope.data.category_id,
    sub_category_id: scope.data.sub_category_id,
    sort_order: parseInt(req.body.sort_order || 0, 10) || 0,
    is_active:
      req.body.is_active === undefined ? true : normalizeIsActive(req.body.is_active),
  };

  if (!cleanData.title) {
    return error(res, 'Title is required', 400);
  }

  const mobileImageFile = getBannerUploadFile(req, 'mobile_image');
  if (mobileImageFile) {
    cleanData.mobile_image_url = await uploadToS3(mobileImageFile, 'cms/banners');
  }

  const banner = await prisma.banner.create({
    data: cleanData,
    include: bannerInclude,
  });

  return success(res, 'Banner created', { banner }, 201);
});

exports.updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bannerId = parseInt(id, 10);
  const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!existing) return error(res, 'Banner not found', 404);

  const imageFile = getBannerUploadFile(req, 'image');
  const mobileImageFile = getBannerUploadFile(req, 'mobile_image');

  const mergedRaw = {
    page_type: req.body.page_type !== undefined ? req.body.page_type : existing.page_type,
    position: req.body.position !== undefined ? req.body.position : existing.position,
    category_id:
      req.body.category_id !== undefined ? req.body.category_id : existing.category_id,
    sub_category_id:
      req.body.sub_category_id !== undefined
        ? req.body.sub_category_id
        : existing.sub_category_id,
  };

  const scope = await validateBannerScope(mergedRaw, { requireCategoryForScoped: true });
  if (!scope.ok) return error(res, scope.message, scope.status);

  const updateData = {
    page_type: scope.data.page_type,
    category_id: scope.data.category_id,
    sub_category_id: scope.data.sub_category_id,
  };

  if (scope.data.position !== undefined) {
    updateData.position = scope.data.position;
  }

  if (req.body.title !== undefined) {
    updateData.title = String(req.body.title).trim();
  }
  if (req.body.link_url !== undefined) {
    updateData.link_url = req.body.link_url ? String(req.body.link_url).trim() : null;
  }
  if (req.body.sort_order !== undefined) {
    updateData.sort_order = parseInt(req.body.sort_order || 0, 10) || 0;
  }
  if (req.body.is_active !== undefined) {
    updateData.is_active = normalizeIsActive(req.body.is_active);
  }

  if (imageFile) {
    updateData.image_url = await uploadToS3(imageFile, 'cms/banners');
  }
  if (mobileImageFile) {
    updateData.mobile_image_url = await uploadToS3(mobileImageFile, 'cms/banners');
  }

  const banner = await prisma.banner.update({
    where: { id: bannerId },
    data: updateData,
    include: bannerInclude,
  });

  return success(res, 'Banner updated', { banner });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await prisma.banner.findUnique({ where: { id: parseInt(id) } });
  if (banner) {
    const keys = [banner.image_url, banner.mobile_image_url]
      .filter(Boolean)
      .map((url) => url.split('.com/')[1])
      .filter(Boolean);
    for (const key of keys) {
      await deleteFromS3(key);
    }
    await prisma.banner.delete({ where: { id: parseInt(id) } });
  }
  return success(res, 'Banner deleted');
});

// ==================== BLOG POSTS ====================

// Admin version - all blog posts
exports.getBlogPostsAdmin = asyncHandler(async (req, res) => {
    const posts = await prisma.blogPost.findMany({
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Blog posts retrieved', { posts });
});

exports.createBlogPost = asyncHandler(async (req, res) => {
    const data = { ...req.body };

    if (req.file) {
        const url = await uploadToS3(req.file, 'cms/blog');
        data.thumbnail = url;
    }

    if (!data.slug) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Convert string booleans to actual booleans
    if (data.is_published !== undefined) {
        data.is_published = data.is_published === 'true' || data.is_published === true;
    }

    // Convert tags array to JSON string if it's an array
    if (Array.isArray(data.tags)) {
        data.tags = JSON.stringify(data.tags);
    }

    const post = await prisma.blogPost.create({ data });
    return success(res, 'Blog post created', { post }, 201);
});

exports.updateBlogPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };

    if (req.file) {
        const url = await uploadToS3(req.file, 'cms/blog');
        data.thumbnail = url;
    }

    // Convert string booleans to actual booleans
    if (data.is_published !== undefined) {
        data.is_published = data.is_published === 'true' || data.is_published === true;
    }

    // Convert tags array to JSON string if it's an array
    if (Array.isArray(data.tags)) {
        data.tags = JSON.stringify(data.tags);
    }

    const post = await prisma.blogPost.update({
        where: { id: parseInt(id) },
        data
    });

    return success(res, 'Blog post updated', { post });
});

exports.deleteBlogPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.blogPost.delete({ where: { id: parseInt(id) } });
    return success(res, 'Blog post deleted');
});

// ==================== FAQs ====================

// Public version - only active FAQs
exports.getFaqs = asyncHandler(async (req, res) => {
    const faqs = await prisma.faq.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'FAQs retrieved', { faqs });
});

// Admin version - all FAQs
exports.getFaqsAdmin = asyncHandler(async (req, res) => {
    const faqs = await prisma.faq.findMany({
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'FAQs retrieved', { faqs });
});

exports.createFaq = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    
    // Convert string booleans to actual booleans
    if (data.is_active !== undefined) {
        data.is_active = data.is_active === 'true' || data.is_active === true;
    }
    if (data.sort_order !== undefined) {
        data.sort_order = parseInt(data.sort_order || 0);
    }
    
    const faq = await prisma.faq.create({ data });
    return success(res, 'FAQ created', { faq }, 201);
});

exports.updateFaq = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    
    // Convert string booleans to actual booleans
    if (data.is_active !== undefined) {
        data.is_active = data.is_active === 'true' || data.is_active === true;
    }
    if (data.sort_order !== undefined) {
        data.sort_order = parseInt(data.sort_order || 0);
    }

    const faq = await prisma.faq.update({
        where: { id: parseInt(id) },
        data
    });
    return success(res, 'FAQ updated', { faq });
});

exports.deleteFaq = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.faq.delete({ where: { id: parseInt(id) } });
    return success(res, 'FAQ deleted');
});

// ==================== PAGES ====================

// Public version - get page by slug
exports.getPageBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const page = await prisma.page.findUnique({
        where: { slug, is_published: true }
    });
    
    if (!page) {
        return error(res, 'Page not found', 404);
    }
    
    return success(res, 'Page retrieved', { page });
});

// Admin version - all pages
exports.getPagesAdmin = asyncHandler(async (req, res) => {
    const pages = await prisma.page.findMany({
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Pages retrieved', { pages });
});

exports.createPage = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.slug) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    // Convert string booleans to actual booleans
    if (data.is_published !== undefined) {
        data.is_published = data.is_published === 'true' || data.is_published === true;
    }
    
    const page = await prisma.page.create({ data });
    return success(res, 'Page created', { page }, 201);
});

exports.updatePage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    
    // Convert string booleans to actual booleans
    if (data.is_published !== undefined) {
        data.is_published = data.is_published === 'true' || data.is_published === true;
    }
    
    const page = await prisma.page.update({
        where: { id: parseInt(id) },
        data
    });
    return success(res, 'Page updated', { page });
});

exports.deletePage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.page.delete({ where: { id: parseInt(id) } });
    return success(res, 'Page deleted');
});

// ==================== TESTIMONIALS ====================

exports.getTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await prisma.testimonial.findMany({
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'Testimonials retrieved', { testimonials });
});

exports.createTestimonial = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (req.file) {
        const url = await uploadToS3(req.file, 'cms/testimonials');
        data.avatar_url = url;
    }
    // Remove avatar field if present (we use avatar_url instead)
    if (data.avatar !== undefined) {
        delete data.avatar;
    }
    // Map field names from request to Prisma schema
    if (data.author_name) {
        data.customer_name = data.author_name;
        delete data.author_name;
    }
    if (data.content) {
        data.text = data.content;
        delete data.content;
    }
    // Convert string booleans to actual booleans
    if (data.is_featured !== undefined) {
        data.is_featured = data.is_featured === 'true' || data.is_featured === true;
    }
    if (data.rating !== undefined) data.rating = parseInt(data.rating);
    if (data.sort_order !== undefined) data.sort_order = parseInt(data.sort_order || 0);

    const testimonial = await prisma.testimonial.create({ data });
    return success(res, 'Testimonial created', { testimonial }, 201);
});

exports.updateTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingTestimonial) {
        return error(res, 'Testimonial not found', 404);
    }

    const data = { ...req.body };
    if (req.file) {
        const url = await uploadToS3(req.file, 'cms/testimonials');
        data.avatar_url = url;
    }
    // Remove avatar field if present (we use avatar_url instead)
    if (data.avatar !== undefined) {
        delete data.avatar;
    }
    // Map field names from request to Prisma schema
    if (data.author_name) {
        data.customer_name = data.author_name;
        delete data.author_name;
    }
    if (data.content) {
        data.text = data.content;
        delete data.content;
    }
    // Convert string booleans to actual booleans
    if (data.is_featured !== undefined) {
        data.is_featured = data.is_featured === 'true' || data.is_featured === true;
    }
    if (data.rating !== undefined) data.rating = parseInt(data.rating);
    if (data.sort_order !== undefined) data.sort_order = parseInt(data.sort_order || 0);

    const testimonial = await prisma.testimonial.update({
        where: { id: parseInt(id) },
        data
    });
    return success(res, 'Testimonial updated', { testimonial });
});

exports.deleteTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingTestimonial) {
        return error(res, 'Testimonial not found', 404);
    }

    await prisma.testimonial.delete({ where: { id: parseInt(id) } });
    return success(res, 'Testimonial deleted');
});
