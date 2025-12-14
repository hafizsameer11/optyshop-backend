const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3, deleteFromS3 } = require('../config/aws');

// ==================== BANNERS ====================

// Public version - only active banners
exports.getBanners = asyncHandler(async (req, res) => {
    const banners = await prisma.banner.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'Banners retrieved', { banners });
});

// Admin version - all banners
exports.getBannersAdmin = asyncHandler(async (req, res) => {
    const banners = await prisma.banner.findMany({
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'Banners retrieved', { banners });
});

exports.createBanner = asyncHandler(async (req, res) => {
    if (!req.file) return error(res, 'Image is required', 400);

    const url = await uploadToS3(req.file, 'cms/banners');
    const data = { ...req.body };
    
    // Convert string booleans to actual booleans
    if (data.is_active !== undefined) {
        data.is_active = data.is_active === 'true' || data.is_active === true;
    }
    if (data.sort_order !== undefined) {
        data.sort_order = parseInt(data.sort_order || 0);
    }
    
    const banner = await prisma.banner.create({
        data: {
            ...data,
            image_url: url
        }
    });

    return success(res, 'Banner created', { banner }, 201);
});

exports.updateBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };

    if (req.file) {
        const url = await uploadToS3(req.file, 'cms/banners');
        data.image_url = url;
    }
    
    // Convert string booleans to actual booleans
    if (data.is_active !== undefined) {
        data.is_active = data.is_active === 'true' || data.is_active === true;
    }
    if (data.sort_order !== undefined) {
        data.sort_order = parseInt(data.sort_order || 0);
    }

    const banner = await prisma.banner.update({
        where: { id: parseInt(id) },
        data
    });

    return success(res, 'Banner updated', { banner });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({ where: { id: parseInt(id) } });
    if (banner) {
        const key = banner.image_url.split('.com/')[1];
        if (key) await deleteFromS3(key);
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
