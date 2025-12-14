const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get product configuration options (lens types, thickness, treatments, colors)
// @route   GET /api/products/:id/configuration
// @access  Public
exports.getProductConfiguration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get product
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Get all prescription lens types (Distance Vision, Near Vision, Progressive)
  const prescriptionLensTypes = await prisma.prescriptionLensType.findMany({
    where: { is_active: true },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      },
      variants: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  // Get lens thickness materials
  const lensThicknessMaterials = await prisma.lensThicknessMaterial.findMany({
    where: { is_active: true },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  // Get lens thickness options
  const lensThicknessOptions = await prisma.lensThicknessOption.findMany({
    where: { is_active: true },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  // Get lens treatments
  const lensTreatments = await prisma.lensTreatment.findMany({
    where: { is_active: true },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  // Get photochromic colors (from lens options with type photochromic)
  const photochromicOption = await prisma.lensOption.findFirst({
    where: {
      type: 'photochromic',
      is_active: true
    },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      },
      finishes: {
        where: { is_active: true },
        include: {
          colors: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  // Get prescription lenses sun colors (from prescription lens types with type that includes sun)
  const prescriptionSunLensType = await prisma.prescriptionLensType.findFirst({
    where: {
      name: { contains: 'Sun' },
      is_active: true
    },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  // Format prescription lens types
  const formattedPrescriptionLensTypes = prescriptionLensTypes.map(type => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    prescriptionType: type.prescription_type,
    basePrice: parseFloat(type.base_price),
    colors: type.colors.map(color => ({
      id: color.id,
      name: color.name,
      colorCode: color.color_code,
      hexCode: color.hex_code,
      imageUrl: color.image_url,
      priceAdjustment: parseFloat(color.price_adjustment)
    })),
    variants: type.variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      slug: variant.slug,
      description: variant.description,
      price: parseFloat(variant.price),
      isRecommended: variant.is_recommended,
      viewingRange: variant.viewing_range,
      useCases: variant.use_cases
    }))
  }));

  // Format lens thickness materials
  const formattedThicknessMaterials = lensThicknessMaterials.map(material => ({
    id: material.id,
    name: material.name,
    slug: material.slug,
    description: material.description,
    price: parseFloat(material.price)
  }));

  // Format lens thickness options
  const formattedThicknessOptions = lensThicknessOptions.map(option => ({
    id: option.id,
    name: option.name,
    slug: option.slug,
    description: option.description,
    thicknessValue: option.thickness_value ? parseFloat(option.thickness_value) : null
  }));

  // Format lens treatments
  const formattedTreatments = lensTreatments.map(treatment => ({
    id: treatment.id,
    name: treatment.name,
    slug: treatment.slug,
    type: treatment.type,
    description: treatment.description,
    price: parseFloat(treatment.price),
    icon: treatment.icon
  }));

  // Format photochromic colors
  let photochromicColors = [];
  if (photochromicOption) {
    // Get colors from the option itself
    photochromicColors = photochromicOption.colors.map(color => ({
      id: color.id,
      name: color.name,
      colorCode: color.color_code,
      hexCode: color.hex_code,
      imageUrl: color.image_url,
      priceAdjustment: parseFloat(color.price_adjustment)
    }));

    // Get colors from finishes
    photochromicOption.finishes.forEach(finish => {
      finish.colors.forEach(color => {
        photochromicColors.push({
          id: color.id,
          name: color.name,
          colorCode: color.color_code,
          hexCode: color.hex_code,
          imageUrl: color.image_url,
          priceAdjustment: parseFloat(color.price_adjustment)
        });
      });
    });
  }

  // Format prescription sun colors
  const prescriptionSunColors = prescriptionSunLensType ? prescriptionSunLensType.colors.map(color => ({
    id: color.id,
    name: color.name,
    colorCode: color.color_code,
    hexCode: color.hex_code,
    imageUrl: color.image_url,
    priceAdjustment: parseFloat(color.price_adjustment)
  })) : [];

  return success(res, 'Product configuration retrieved successfully', {
    product: {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price)
    },
    prescriptionLensTypes: formattedPrescriptionLensTypes,
    lensThicknessMaterials: formattedThicknessMaterials,
    lensThicknessOptions: formattedThicknessOptions,
    lensTreatments: formattedTreatments,
    photochromicColors,
    prescriptionSunColors
  });
});

// @desc    Get lens type options (Distance Vision, Near Vision, Progressive)
// @route   GET /api/products/configuration/lens-types
// @access  Public
exports.getLensTypes = asyncHandler(async (req, res) => {
  const prescriptionLensTypes = await prisma.prescriptionLensType.findMany({
    where: { is_active: true },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      },
      variants: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  const formatted = prescriptionLensTypes.map(type => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    prescriptionType: type.prescription_type,
    basePrice: parseFloat(type.base_price),
    colors: type.colors.map(color => ({
      id: color.id,
      name: color.name,
      colorCode: color.color_code,
      hexCode: color.hex_code,
      imageUrl: color.image_url,
      priceAdjustment: parseFloat(color.price_adjustment)
    })),
    variants: type.variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      slug: variant.slug,
      description: variant.description,
      price: parseFloat(variant.price),
      isRecommended: variant.is_recommended,
      viewingRange: variant.viewing_range,
      useCases: variant.use_cases
    }))
  }));

  return success(res, 'Lens types retrieved successfully', {
    lensTypes: formatted
  });
});

