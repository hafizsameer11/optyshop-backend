const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get product customization options (lens options, finishes, colors, treatments)
// @route   GET /api/products/:id/customization
// @access  Public
exports.getProductCustomization = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Get all lens options with finishes and colors
  const lensOptions = await prisma.lensOption.findMany({
    where: { is_active: true },
    include: {
      finishes: {
        where: { is_active: true },
        include: {
          colors: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      },
      colors: {
        where: { 
          is_active: true,
          lens_finish_id: null // Colors directly on option (no finish)
        },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  // Get all lens treatments
  const treatments = await prisma.lensTreatment.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' }
  });

  // Format lens options
  const formattedOptions = lensOptions.map(option => ({
    id: option.id,
    name: option.name,
    slug: option.slug,
    type: option.type,
    description: option.description,
    basePrice: parseFloat(option.base_price),
    finishes: option.finishes.map(finish => ({
      id: finish.id,
      name: finish.name,
      slug: finish.slug,
      description: finish.description,
      priceAdjustment: parseFloat(finish.price_adjustment),
      colors: finish.colors.map(color => ({
        id: color.id,
        name: color.name,
        colorCode: color.color_code,
        hexCode: color.hex_code,
        imageUrl: color.image_url,
        priceAdjustment: parseFloat(color.price_adjustment)
      }))
    })),
    colors: option.colors.map(color => ({
      id: color.id,
      name: color.name,
      colorCode: color.color_code,
      hexCode: color.hex_code,
      imageUrl: color.image_url,
      priceAdjustment: parseFloat(color.price_adjustment)
    }))
  }));

  // Format treatments
  const formattedTreatments = treatments.map(treatment => ({
    id: treatment.id,
    name: treatment.name,
    slug: treatment.slug,
    type: treatment.type,
    description: treatment.description,
    price: parseFloat(treatment.price),
    icon: treatment.icon
  }));

  // Get prescription lens types with colors
  const dbPrescriptionLensTypes = await prisma.prescriptionLensType.findMany({
    where: { is_active: true },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  let prescriptionLensTypes;

  if (dbPrescriptionLensTypes && dbPrescriptionLensTypes.length > 0) {
    prescriptionLensTypes = dbPrescriptionLensTypes.map(type => ({
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
      }))
    }));
  } else {
    // Fallback to hardcoded values
    prescriptionLensTypes = [
      {
        id: 'distance_vision',
        name: 'Distance Vision',
        slug: 'distance-vision',
        description: 'For distance (Thin, anti-glare, blue-cut options)',
        prescriptionType: 'single_vision',
        basePrice: 60.00,
        colors: []
      },
      {
        id: 'near_vision',
        name: 'Near Vision',
        slug: 'near-vision',
        description: 'For near vision (Thin, anti-glare, blue-cut options)',
        prescriptionType: 'single_vision',
        basePrice: 60.00,
        colors: []
      },
      {
        id: 'progressive',
        name: 'Progressive',
        slug: 'progressive',
        description: 'Progressives (For two powers in same lenses)',
        prescriptionType: 'progressive',
        basePrice: 60.00,
        colors: []
      }
    ];
  }

  return success(res, 'Product customization options retrieved successfully', {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: parseFloat(product.price),
      category: product.category
    },
    lensOptions: formattedOptions,
    treatments: formattedTreatments,
    prescriptionLensTypes
  });
});

// @desc    Calculate product customization price
// @route   POST /api/products/:id/customization/calculate
// @access  Public
exports.calculateCustomizationPrice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    lens_option_id,
    lens_finish_id,
    lens_color_id,
    treatment_ids = [],
    prescription_lens_type,
    prescription_data,
    quantity = 1
  } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  let totalPrice = parseFloat(product.price);
  const breakdown = [
    {
      name: product.name,
      type: 'base_product',
      price: parseFloat(product.price),
      quantity: quantity
    }
  ];

  // Add lens option price
  if (lens_option_id) {
    const lensOption = await prisma.lensOption.findUnique({
      where: { id: parseInt(lens_option_id) },
      include: {
        finishes: {
          include: {
            colors: true
          }
        },
        colors: true
        }
    });

    if (lensOption) {
      const optionPrice = parseFloat(lensOption.base_price);
      if (optionPrice > 0) {
        totalPrice += optionPrice;
        breakdown.push({
          name: lensOption.name,
          type: 'lens_option',
          price: optionPrice,
          quantity: quantity
        });
      }

      // Add finish price if selected
      if (lens_finish_id) {
        const finish = lensOption.finishes.find(f => f.id === parseInt(lens_finish_id));
        if (finish) {
          const finishPrice = parseFloat(finish.price_adjustment);
          if (finishPrice > 0) {
            totalPrice += finishPrice;
            breakdown.push({
              name: `${finish.name} (Finish)`,
              type: 'lens_finish',
              price: finishPrice,
              quantity: quantity
            });
          }

          // Add color price if selected
          if (lens_color_id) {
            const color = finish.colors.find(c => c.id === parseInt(lens_color_id));
            if (color) {
              const colorPrice = parseFloat(color.price_adjustment);
              if (colorPrice > 0) {
                totalPrice += colorPrice;
                breakdown.push({
                  name: `${color.name} (Color)`,
                  type: 'lens_color',
                  price: colorPrice,
                  quantity: quantity
                });
              }
            }
          }
        }
      } else if (lens_color_id) {
        // Color directly on option (no finish)
        const color = lensOption.colors.find(c => c.id === parseInt(lens_color_id));
        if (color) {
          const colorPrice = parseFloat(color.price_adjustment);
          if (colorPrice > 0) {
            totalPrice += colorPrice;
            breakdown.push({
              name: `${color.name} (Color)`,
              type: 'lens_color',
              price: colorPrice,
              quantity: quantity
            });
          }
        }
      }
    }
  }

  // Add treatment prices
  if (treatment_ids) {
    // Normalize treatment_ids to always be an array
    let treatmentIdsArray = [];
    if (Array.isArray(treatment_ids)) {
      treatmentIdsArray = treatment_ids;
    } else if (typeof treatment_ids === 'string') {
      try {
        treatmentIdsArray = JSON.parse(treatment_ids);
      } catch (e) {
        // If JSON parse fails, try splitting by comma
        treatmentIdsArray = treatment_ids.split(',').map(id => id.trim());
      }
    } else if (typeof treatment_ids === 'number') {
      treatmentIdsArray = [treatment_ids];
    }

    if (treatmentIdsArray.length > 0) {
      const validTreatmentIds = treatmentIdsArray
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      
      if (validTreatmentIds.length > 0) {
        const treatments = await prisma.lensTreatment.findMany({
          where: {
            id: { in: validTreatmentIds },
            is_active: true
          }
        });

        treatments.forEach(treatment => {
          const treatmentPrice = parseFloat(treatment.price);
          if (treatmentPrice > 0) {
            totalPrice += treatmentPrice;
            breakdown.push({
              name: treatment.name,
              type: 'treatment',
              price: treatmentPrice,
              quantity: quantity
            });
          }
        });
      }
    }
  }

  // Add prescription lens type if selected
  if (prescription_lens_type) {
    // Try to get from database, fallback to default price
    let prescriptionLensType;
    const prescriptionLensTypeId = typeof prescription_lens_type === 'number' 
      ? prescription_lens_type 
      : null;
    
    if (prescriptionLensTypeId) {
      prescriptionLensType = await prisma.prescriptionLensType.findUnique({
        where: { id: prescriptionLensTypeId },
        include: {
          colors: true
        }
      });
    }

    const prescriptionBasePrice = prescriptionLensType 
      ? parseFloat(prescriptionLensType.base_price)
      : 60.00; // Default price

    totalPrice += prescriptionBasePrice;
    breakdown.push({
      name: prescriptionLensType 
        ? `Prescription Lenses (${prescriptionLensType.name})`
        : `Prescription Lenses (${prescription_lens_type})`,
      type: 'prescription_lens',
      price: prescriptionBasePrice,
      quantity: quantity
    });

    // Add prescription lens color price if selected
    if (req.body.prescription_lens_color_id && prescriptionLensType) {
      const color = prescriptionLensType.colors.find(
        c => c.id === parseInt(req.body.prescription_lens_color_id)
      );
      if (color) {
        const colorPrice = parseFloat(color.price_adjustment);
        if (colorPrice > 0) {
          totalPrice += colorPrice;
          breakdown.push({
            name: `${color.name} (Prescription Lens Color)`,
            type: 'prescription_lens_color',
            price: colorPrice,
            quantity: quantity
          });
        }
      }
    }
  }

  const subtotal = totalPrice;
  const finalTotal = subtotal * quantity;

  return success(res, 'Price calculated successfully', {
    breakdown,
    subtotal: parseFloat(subtotal.toFixed(2)),
    quantity: parseInt(quantity),
    total: parseFloat(finalTotal.toFixed(2)),
    currency: 'EUR', // Default currency, can be made configurable
    prescriptionLensType: prescription_lens_type || null,
    prescriptionData: prescription_data || null
  });
});

// @desc    Get all customization options (for admin/product pages)
// @route   GET /api/customization/options
// @access  Public
exports.getAllCustomizationOptions = asyncHandler(async (req, res) => {
  const [lensOptions, treatments] = await Promise.all([
    prisma.lensOption.findMany({
      where: { is_active: true },
      include: {
        finishes: {
          where: { is_active: true },
          include: {
            colors: {
              where: { is_active: true },
              orderBy: { sort_order: 'asc' }
            }
          },
          orderBy: { sort_order: 'asc' }
        },
        colors: {
          where: { 
            is_active: true,
            lens_finish_id: null
          },
          orderBy: { sort_order: 'asc' }
        }
      },
      orderBy: { sort_order: 'asc' }
    }),
    prisma.lensTreatment.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' }
    })
  ]);

  const formattedOptions = lensOptions.map(option => ({
    id: option.id,
    name: option.name,
    slug: option.slug,
    type: option.type,
    description: option.description,
    basePrice: parseFloat(option.base_price),
    finishes: option.finishes.map(finish => ({
      id: finish.id,
      name: finish.name,
      slug: finish.slug,
      description: finish.description,
      priceAdjustment: parseFloat(finish.price_adjustment),
      colors: finish.colors.map(color => ({
        id: color.id,
        name: color.name,
        colorCode: color.color_code,
        hexCode: color.hex_code,
        imageUrl: color.image_url,
        priceAdjustment: parseFloat(color.price_adjustment)
      }))
    })),
    colors: option.colors.map(color => ({
      id: color.id,
      name: color.name,
      colorCode: color.color_code,
      hexCode: color.hex_code,
      imageUrl: color.image_url,
      priceAdjustment: parseFloat(color.price_adjustment)
    }))
  }));

  const formattedTreatments = treatments.map(treatment => ({
    id: treatment.id,
    name: treatment.name,
    slug: treatment.slug,
    type: treatment.type,
    description: treatment.description,
    price: parseFloat(treatment.price),
    icon: treatment.icon
  }));

  return success(res, 'Customization options retrieved successfully', {
    lensOptions: formattedOptions,
    treatments: formattedTreatments
  });
});

// @desc    Get prescription lens types (Distance Vision, Near Vision, Progressive)
// @route   GET /api/customization/prescription-lens-types
// @access  Public
exports.getPrescriptionLensTypes = asyncHandler(async (req, res) => {
  // Try to get from database first, fallback to hardcoded values
  const dbPrescriptionLensTypes = await prisma.prescriptionLensType.findMany({
    where: { is_active: true },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  let prescriptionLensTypes;

  if (dbPrescriptionLensTypes && dbPrescriptionLensTypes.length > 0) {
    // Use database values
    prescriptionLensTypes = dbPrescriptionLensTypes.map(type => ({
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
      }))
    }));
  } else {
    // Fallback to hardcoded values (no colors initially)
    prescriptionLensTypes = [
      {
        id: 'distance_vision',
        name: 'Distance Vision',
        slug: 'distance-vision',
        description: 'For distance (Thin, anti-glare, blue-cut options)',
        prescriptionType: 'single_vision',
        basePrice: 60.00,
        colors: []
      },
      {
        id: 'near_vision',
        name: 'Near Vision',
        slug: 'near-vision',
        description: 'For near vision (Thin, anti-glare, blue-cut options)',
        prescriptionType: 'single_vision',
        basePrice: 60.00,
        colors: []
      },
      {
        id: 'progressive',
        name: 'Progressive',
        slug: 'progressive',
        description: 'Progressives (For two powers in same lenses)',
        prescriptionType: 'progressive',
        basePrice: 60.00,
        colors: []
      }
    ];
  }

  return success(res, 'Prescription lens types retrieved successfully', {
    prescriptionLensTypes
  });
});

// @desc    Calculate product customization price with prescription
// @route   POST /api/customization/products/:id/customization/calculate
// @access  Public
exports.calculateCustomizationPriceWithPrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    lens_option_id,
    lens_finish_id,
    lens_color_id,
    treatment_ids = [],
    prescription_lens_type,
    prescription_data,
    quantity = 1
  } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  let totalPrice = parseFloat(product.price);
  const breakdown = [
    {
      name: product.name,
      type: 'base_product',
      price: parseFloat(product.price),
      quantity: quantity
    }
  ];

  // Add lens option price
  if (lens_option_id) {
    const lensOption = await prisma.lensOption.findUnique({
      where: { id: parseInt(lens_option_id) },
      include: {
        finishes: {
          include: {
            colors: true
          }
        },
        colors: true
      }
    });

    if (lensOption) {
      const optionPrice = parseFloat(lensOption.base_price);
      if (optionPrice > 0) {
        totalPrice += optionPrice;
        breakdown.push({
          name: lensOption.name,
          type: 'lens_option',
          price: optionPrice,
          quantity: quantity
        });
      }

      // Add finish price if selected
      if (lens_finish_id) {
        const finish = lensOption.finishes.find(f => f.id === parseInt(lens_finish_id));
        if (finish) {
          const finishPrice = parseFloat(finish.price_adjustment);
          if (finishPrice > 0) {
            totalPrice += finishPrice;
            breakdown.push({
              name: `${finish.name} (Finish)`,
              type: 'lens_finish',
              price: finishPrice,
              quantity: quantity
            });
          }

          // Add color price if selected
          if (lens_color_id) {
            const color = finish.colors.find(c => c.id === parseInt(lens_color_id));
            if (color) {
              const colorPrice = parseFloat(color.price_adjustment);
              if (colorPrice > 0) {
                totalPrice += colorPrice;
                breakdown.push({
                  name: `${color.name} (Color)`,
                  type: 'lens_color',
                  price: colorPrice,
                  quantity: quantity
                });
              }
            }
          }
        }
      } else if (lens_color_id) {
        // Color directly on option (no finish)
        const color = lensOption.colors.find(c => c.id === parseInt(lens_color_id));
        if (color) {
          const colorPrice = parseFloat(color.price_adjustment);
          if (colorPrice > 0) {
            totalPrice += colorPrice;
            breakdown.push({
              name: `${color.name} (Color)`,
              type: 'lens_color',
              price: colorPrice,
              quantity: quantity
            });
          }
        }
      }
    }
  }

  // Add treatment prices
  if (treatment_ids) {
    // Normalize treatment_ids to always be an array
    let treatmentIdsArray = [];
    if (Array.isArray(treatment_ids)) {
      treatmentIdsArray = treatment_ids;
    } else if (typeof treatment_ids === 'string') {
      try {
        treatmentIdsArray = JSON.parse(treatment_ids);
      } catch (e) {
        // If JSON parse fails, try splitting by comma
        treatmentIdsArray = treatment_ids.split(',').map(id => id.trim());
      }
    } else if (typeof treatment_ids === 'number') {
      treatmentIdsArray = [treatment_ids];
    }

    if (treatmentIdsArray.length > 0) {
      const validTreatmentIds = treatmentIdsArray
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      
      if (validTreatmentIds.length > 0) {
        const treatments = await prisma.lensTreatment.findMany({
          where: {
            id: { in: validTreatmentIds },
            is_active: true
          }
        });

        treatments.forEach(treatment => {
          const treatmentPrice = parseFloat(treatment.price);
          if (treatmentPrice > 0) {
            totalPrice += treatmentPrice;
            breakdown.push({
              name: treatment.name,
              type: 'treatment',
              price: treatmentPrice,
              quantity: quantity
            });
          }
        });
      }
    }
  }

  // Add prescription lens type if selected
  if (prescription_lens_type) {
    // Try to get from database, fallback to default price
    let prescriptionLensType;
    const prescriptionLensTypeId = typeof prescription_lens_type === 'number' 
      ? prescription_lens_type 
      : null;
    
    if (prescriptionLensTypeId) {
      prescriptionLensType = await prisma.prescriptionLensType.findUnique({
        where: { id: prescriptionLensTypeId },
        include: {
          colors: true
        }
      });
    }

    const prescriptionBasePrice = prescriptionLensType 
      ? parseFloat(prescriptionLensType.base_price)
      : 60.00; // Default price

    totalPrice += prescriptionBasePrice;
    breakdown.push({
      name: prescriptionLensType 
        ? `Prescription Lenses (${prescriptionLensType.name})`
        : `Prescription Lenses (${prescription_lens_type})`,
      type: 'prescription_lens',
      price: prescriptionBasePrice,
      quantity: quantity
    });

    // Add prescription lens color price if selected
    if (req.body.prescription_lens_color_id && prescriptionLensType) {
      const color = prescriptionLensType.colors.find(
        c => c.id === parseInt(req.body.prescription_lens_color_id)
      );
      if (color) {
        const colorPrice = parseFloat(color.price_adjustment);
        if (colorPrice > 0) {
          totalPrice += colorPrice;
          breakdown.push({
            name: `${color.name} (Prescription Lens Color)`,
            type: 'prescription_lens_color',
            price: colorPrice,
            quantity: quantity
          });
        }
      }
    }
  }

  const subtotal = totalPrice;
  const finalTotal = subtotal * quantity;

  return success(res, 'Price calculated successfully', {
    breakdown,
    subtotal: parseFloat(subtotal.toFixed(2)),
    quantity: parseInt(quantity),
    total: parseFloat(finalTotal.toFixed(2)),
    currency: 'EUR',
    prescriptionLensType: prescription_lens_type || null,
    prescriptionData: prescription_data || null
  });
});

