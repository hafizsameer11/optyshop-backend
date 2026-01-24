const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3 } = require('../config/aws');

// @desc    Get all flash offers (Public - with optional activeOnly filter)
// @route   GET /api/flash-offers
// @access  Public
exports.getFlashOffers = asyncHandler(async (req, res) => {
    const { activeOnly } = req.query;
    
    const where = {};
    if (activeOnly === 'true') {
        const now = new Date();
        where.is_active = true;
        where.starts_at = { lte: now };
        where.ends_at = { gte: now };
    }
    
    const offers = await prisma.flashOffer.findMany({
        where,
        orderBy: { created_at: 'desc' }
    });

    // Parse product_ids and calculate countdown for each offer
    const offersWithCountdown = offers.map(offer => {
        const productIds = offer.product_ids ? JSON.parse(offer.product_ids) : [];
        const now = new Date();
        const endsAt = new Date(offer.ends_at);
        const timeRemaining = endsAt - now;
        
        let countdown = null;
        if (timeRemaining > 0) {
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
            countdown = { hours, minutes, seconds, totalSeconds: Math.floor(timeRemaining / 1000) };
        }

        return {
            ...offer,
            product_ids: productIds,
            countdown,
            is_expired: timeRemaining <= 0
        };
    });

    return success(res, 'Flash offers retrieved successfully', { offers: offersWithCountdown });
});

// @desc    Get active flash offer (Public)
// @route   GET /api/flash-offers/active
// @access  Public
exports.getActiveFlashOffer = asyncHandler(async (req, res) => {
    const now = new Date();
    
    const offer = await prisma.flashOffer.findFirst({
        where: {
            is_active: true,
            starts_at: { lte: now },
            ends_at: { gte: now }
        },
        orderBy: { created_at: 'desc' }
    });

    if (!offer) {
        return success(res, 'No active flash offer', { offer: null });
    }

    // Parse product_ids and calculate countdown
    const productIds = offer.product_ids ? JSON.parse(offer.product_ids) : [];
    const endsAt = new Date(offer.ends_at);
    const timeRemaining = endsAt - now;
    
    let countdown = null;
    if (timeRemaining > 0) {
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        countdown = { hours, minutes, seconds, totalSeconds: Math.floor(timeRemaining / 1000) };
    }

    const offerWithCountdown = {
        ...offer,
        product_ids: productIds,
        countdown,
        is_expired: timeRemaining <= 0
    };

    return success(res, 'Active flash offer retrieved successfully', { offer: offerWithCountdown });
});

// @desc    Get all flash offers (Admin)
// @route   GET /api/admin/flash-offers
// @access  Private/Admin
exports.getFlashOffersAdmin = asyncHandler(async (req, res) => {
    const offers = await prisma.flashOffer.findMany({
        orderBy: { created_at: 'desc' }
    });

    // Parse product_ids for admin view
    const offersWithProducts = offers.map(offer => ({
        ...offer,
        product_ids: offer.product_ids ? JSON.parse(offer.product_ids) : []
    }));

    return success(res, 'Flash offers retrieved successfully', { offers: offersWithProducts });
});

// @desc    Get flash offer by ID (Admin)
// @route   GET /api/admin/flash-offers/:id
// @access  Private/Admin
exports.getFlashOfferById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const offer = await prisma.flashOffer.findUnique({
        where: { id: parseInt(id) }
    });

    if (!offer) {
        return error(res, 'Flash offer not found', 404);
    }

    return success(res, 'Flash offer retrieved successfully', {
        offer: {
            ...offer,
            product_ids: offer.product_ids ? JSON.parse(offer.product_ids) : []
        }
    });
});

// @desc    Create flash offer (Admin)
// @route   POST /api/admin/flash-offers
// @access  Private/Admin
exports.createFlashOffer = asyncHandler(async (req, res) => {
    const { product_ids, starts_at, ends_at, ...rest } = req.body;
    
    const offerData = { ...rest };
    
    // Handle product_ids - convert array to JSON string
    if (product_ids) {
        if (Array.isArray(product_ids)) {
            offerData.product_ids = JSON.stringify(product_ids);
        } else if (typeof product_ids === 'string') {
            // Try to parse if it's already a JSON string
            try {
                JSON.parse(product_ids);
                offerData.product_ids = product_ids;
            } catch {
                offerData.product_ids = JSON.stringify([product_ids]);
            }
        }
    }

    // Handle date fields
    if (starts_at !== undefined) {
        offerData.starts_at = starts_at ? new Date(starts_at) : new Date();
    }
    
    if (ends_at === undefined || !ends_at) {
        return error(res, 'ends_at is required', 400);
    }
    offerData.ends_at = new Date(ends_at);

    // Handle image upload if provided
    if (req.file) {
        const imageUrl = await uploadToS3(req.file, 'flash-offers');
        offerData.image_url = imageUrl;
    }

    // Handle link_url
    if (offerData.link_url === '') {
        offerData.link_url = null;
    }

    // Convert is_active from string to boolean (FormData sends strings)
    if (offerData.is_active !== undefined && offerData.is_active !== null) {
        if (typeof offerData.is_active === 'string') {
            offerData.is_active = offerData.is_active.toLowerCase() === 'true';
        } else {
            offerData.is_active = Boolean(offerData.is_active);
        }
    } else {
        offerData.is_active = true;
    }

    const offer = await prisma.flashOffer.create({
        data: offerData
    });

    return success(res, 'Flash offer created successfully', {
        offer: {
            ...offer,
            product_ids: offer.product_ids ? JSON.parse(offer.product_ids) : []
        }
    }, 201);
});

// @desc    Update flash offer (Admin)
// @route   PUT /api/admin/flash-offers/:id
// @access  Private/Admin
exports.updateFlashOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { product_ids, starts_at, ends_at, ...rest } = req.body;

    const updateData = { ...rest };

    // Handle product_ids - convert array to JSON string
    if (product_ids !== undefined) {
        if (Array.isArray(product_ids)) {
            updateData.product_ids = JSON.stringify(product_ids);
        } else if (typeof product_ids === 'string') {
            // Try to parse if it's already a JSON string
            try {
                JSON.parse(product_ids);
                updateData.product_ids = product_ids;
            } catch {
                updateData.product_ids = JSON.stringify([product_ids]);
            }
        }
    }

    // Handle date fields
    if (starts_at !== undefined) {
        updateData.starts_at = starts_at ? new Date(starts_at) : new Date();
    }
    
    if (ends_at !== undefined) {
        updateData.ends_at = new Date(ends_at);
    }

    // Handle image upload if provided
    if (req.file) {
        const imageUrl = await uploadToS3(req.file, 'flash-offers');
        updateData.image_url = imageUrl;
    }

    // Handle link_url
    if (updateData.link_url === '') {
        updateData.link_url = null;
    }

    // Convert is_active from string to boolean (FormData sends strings)
    if (updateData.is_active !== undefined && updateData.is_active !== null) {
        if (typeof updateData.is_active === 'string') {
            updateData.is_active = updateData.is_active.toLowerCase() === 'true';
        } else {
            updateData.is_active = Boolean(updateData.is_active);
        }
    }

    const offer = await prisma.flashOffer.update({
        where: { id: parseInt(id) },
        data: updateData
    });

    return success(res, 'Flash offer updated successfully', {
        offer: {
            ...offer,
            product_ids: offer.product_ids ? JSON.parse(offer.product_ids) : []
        }
    });
});

// @desc    Delete flash offer (Admin)
// @route   DELETE /api/admin/flash-offers/:id
// @access  Private/Admin
exports.deleteFlashOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await prisma.flashOffer.delete({
        where: { id: parseInt(id) }
    });

    return success(res, 'Flash offer deleted successfully');
});
