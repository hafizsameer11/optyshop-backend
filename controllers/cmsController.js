const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3, deleteFromS3 } = require('../config/aws');

// ==================== BANNERS ====================

exports.getBanners = asyncHandler(async (req, res) => {
    const banners = await prisma.banner.findMany({
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'Banners retrieved', { banners });
});

exports.createBanner = asyncHandler(async (req, res) => {
    if (!req.file) return error(res, 'Image is required', 400);

    const url = await uploadToS3(req.file, 'cms/banners');
    const banner = await prisma.banner.create({
        data: {
            ...req.body,
            image_url: url,
            sort_order: parseInt(req.body.sort_order || 0)
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
    if (data.sort_order) data.sort_order = parseInt(data.sort_order);

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

exports.getBlogPosts = asyncHandler(async (req, res) => {
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

exports.getFaqs = asyncHandler(async (req, res) => {
    const faqs = await prisma.faq.findMany({
        orderBy: { sort_order: 'asc' }
    });
    return success(res, 'FAQs retrieved', { faqs });
});

exports.createFaq = asyncHandler(async (req, res) => {
    const faq = await prisma.faq.create({
        data: {
            ...req.body,
            sort_order: parseInt(req.body.sort_order || 0)
        }
    });
    return success(res, 'FAQ created', { faq }, 201);
});

exports.updateFaq = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.sort_order) data.sort_order = parseInt(data.sort_order);

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

exports.getPages = asyncHandler(async (req, res) => {
    const pages = await prisma.page.findMany();
    return success(res, 'Pages retrieved', { pages });
});

exports.createPage = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.slug) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const page = await prisma.page.create({ data });
    return success(res, 'Page created', { page }, 201);
});

exports.updatePage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = await prisma.page.update({
        where: { id: parseInt(id) },
        data: req.body
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
    if (data.rating) data.rating = parseInt(data.rating);
    if (data.sort_order) data.sort_order = parseInt(data.sort_order);

    const testimonial = await prisma.testimonial.create({ data });
    return success(res, 'Testimonial created', { testimonial }, 201);
});

exports.updateTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    if (req.file) {
        const url = await uploadToS3(req.file, 'cms/testimonials');
        data.avatar_url = url;
    }
    if (data.rating) data.rating = parseInt(data.rating);
    if (data.sort_order) data.sort_order = parseInt(data.sort_order);

    const testimonial = await prisma.testimonial.update({
        where: { id: parseInt(id) },
        data
    });
    return success(res, 'Testimonial updated', { testimonial });
});

exports.deleteTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.testimonial.delete({ where: { id: parseInt(id) } });
    return success(res, 'Testimonial deleted');
});
