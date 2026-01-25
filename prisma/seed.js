const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { caseStudies, blogArticles, jobs, formConfigs } = require('../data/dynamicContent');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productLensCoating.deleteMany();
  await prisma.productLensType.deleteMany();
  await prisma.frameSize.deleteMany();
  await prisma.product.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.lensType.deleteMany();
  await prisma.lensCoating.deleteMany();
  await prisma.prescriptionLensVariant.deleteMany();
  await prisma.prescriptionLensType.deleteMany();
  await prisma.simulationConfig.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.formConfig.deleteMany();
  await prisma.caseStudy.deleteMany();
  await prisma.blogArticle.deleteMany();
  await prisma.job.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@optyshop.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      email_verified: true
    }
  });

  // Create Test Customer
  console.log('👤 Creating test customer...');
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      password: customerPassword,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      role: 'customer',
      is_active: true,
      email_verified: true
    }
  });

  // Seed dynamic content (case studies, blog, jobs, form configs)
  console.log('📰 Seeding case studies, blog articles, jobs, and form configs...');

  if (caseStudies?.length) {
    await prisma.caseStudy.createMany({
      data: caseStudies.map((item) => ({
        slug: item.slug,
        title: item.title,
        hero_title: item.heroTitle,
        hero_subtitle: item.heroSubtitle || null,
        category: item.category || null,
        person: item.person ? JSON.stringify(item.person) : null,
        image_url: item.image || null,
        content: item.content || null,
        tags: item.tags ? JSON.stringify(item.tags) : null,
        is_published: true,
      })),
    });
  }

  if (blogArticles?.length) {
    await prisma.blogArticle.createMany({
      data: blogArticles.map((item) => ({
        slug: item.slug,
        title: item.title,
        category: item.category || null,
        snippet: item.snippet || null,
        summary: item.summary || null,
        content: item.content || '',
        read_time: item.readTime || null,
        header_image: item.headerImage || null,
        key_points: item.keyPoints ? JSON.stringify(item.keyPoints) : null,
        published_at: item.date ? new Date(item.date) : new Date(),
        is_published: true,
      })),
    });
  }

  if (jobs?.length) {
    await prisma.job.createMany({
      data: jobs.map((job) => ({
        slug: job.slug || null,
        title: job.title,
        department: job.department || null,
        location: job.location || null,
        description: job.description || null,
        requirements: job.requirements ? JSON.stringify(job.requirements) : null,
        apply_url: job.applyUrl || null,
        is_active: job.isActive !== false,
      })),
    });
  }

  const formConfigValues = formConfigs ? Object.values(formConfigs) : [];
  if (formConfigValues.length) {
    await prisma.formConfig.createMany({
      data: formConfigValues.map((config) => ({
        name: config.name,
        title: config.title || null,
        description: config.description || null,
        fields: config.fields ? JSON.stringify(config.fields) : null,
        cta_text: config.ctaText || null,
        meta: config.meta ? JSON.stringify(config.meta) : null,
        is_active: true,
      })),
    });
  }

  // Create Categories
  console.log('📁 Creating categories...');
  const category1 = await prisma.category.create({
    data: {
      name: 'Prescription Glasses',
      slug: 'prescription-glasses',
      description: 'Prescription eyeglasses for vision correction',
      is_active: true,
      sort_order: 1
    }
  });

  const category2 = await prisma.category.create({
    data: {
      name: 'Sunglasses',
      slug: 'sunglasses',
      description: 'Stylish sunglasses for UV protection',
      is_active: true,
      sort_order: 2
    }
  });

  const category3 = await prisma.category.create({
    data: {
      name: 'Reading Glasses',
      slug: 'reading-glasses',
      description: 'Reading glasses for close-up work',
      is_active: true,
      sort_order: 3
    }
  });

  // Create Lens Types
  console.log('🔍 Creating lens types...');
  const lensType156 = await prisma.lensType.create({
    data: {
      name: 'Standard Index 1.56',
      slug: 'standard-index-156',
      description: 'Standard lens index, suitable for low to moderate prescriptions',
      index: 1.56,
      thickness_factor: 1.0,
      price_adjustment: 0.00,
      is_active: true
    }
  });

  const lensType161 = await prisma.lensType.create({
    data: {
      name: 'Mid Index 1.61',
      slug: 'mid-index-161',
      description: 'Mid-index lens, thinner than standard',
      index: 1.61,
      thickness_factor: 0.85,
      price_adjustment: 50.00,
      is_active: true
    }
  });

  const lensType167 = await prisma.lensType.create({
    data: {
      name: 'High Index 1.67',
      slug: 'high-index-167',
      description: 'High-index lens for strong prescriptions',
      index: 1.67,
      thickness_factor: 0.70,
      price_adjustment: 100.00,
      is_active: true
    }
  });

  const lensType174 = await prisma.lensType.create({
    data: {
      name: 'Ultra High Index 1.74',
      slug: 'ultra-high-index-174',
      description: 'Ultra-thin lens for very strong prescriptions',
      index: 1.74,
      thickness_factor: 0.60,
      price_adjustment: 200.00,
      is_active: true
    }
  });

  // Create Prescription Lens Types
  console.log('👓 Creating prescription lens types...');
  const distanceVision = await prisma.prescriptionLensType.create({
    data: {
      name: 'Distance Vision',
      slug: 'distance-vision',
      description: 'For distance (Thin, anti-glare, blue-cut options)',
      prescription_type: 'single_vision',
      base_price: 60.00,
      is_active: true,
      sort_order: 1
    }
  });

  const nearVision = await prisma.prescriptionLensType.create({
    data: {
      name: 'Near Vision',
      slug: 'near-vision',
      description: 'For near/reading (Thin, anti-glare, blue-cut options)',
      prescription_type: 'single_vision',
      base_price: 60.00,
      is_active: true,
      sort_order: 2
    }
  });

  const progressive = await prisma.prescriptionLensType.create({
    data: {
      name: 'Progressive',
      slug: 'progressive',
      description: 'Progressives (For two powers in same lenses)',
      prescription_type: 'progressive',
      base_price: 60.00,
      is_active: true,
      sort_order: 3
    }
  });

  // Create Prescription Lens Variants for Progressive
  console.log('🔍 Creating progressive lens variants...');
  await prisma.prescriptionLensVariant.createMany({
    data: [
      {
        prescription_lens_type_id: progressive.id,
        name: 'Premium Progressive',
        slug: 'premium-progressive',
        description: 'High-quality progressive lenses with advanced technology',
        price: 150.00,
        is_recommended: true,
        viewing_range: 'Wide',
        use_cases: 'Maximum comfort & balanced vision',
        is_active: true,
        sort_order: 1
      },
      {
        prescription_lens_type_id: progressive.id,
        name: 'Standard Progressive',
        slug: 'standard-progressive',
        description: 'Standard progressive lenses for everyday use',
        price: 100.00,
        is_recommended: false,
        viewing_range: 'Standard',
        use_cases: 'Perfect for everyday tasks',
        is_active: true,
        sort_order: 2
      },
      {
        prescription_lens_type_id: progressive.id,
        name: 'Basic Progressive',
        slug: 'basic-progressive',
        description: 'Affordable progressive lens option',
        price: 75.00,
        is_recommended: false,
        viewing_range: 'Basic',
        use_cases: 'Budget-friendly option',
        is_active: true,
        sort_order: 3
      }
    ]
  });

  // Create Lens Coatings
  console.log('✨ Creating lens coatings...');
  const coatingAR = await prisma.lensCoating.create({
    data: {
      name: 'Anti-Reflective Coating',
      slug: 'anti-reflective-coating',
      type: 'ar',
      description: 'Reduces glare and reflections',
      price_adjustment: 30.00,
      is_active: true
    }
  });

  const coatingBlue = await prisma.lensCoating.create({
    data: {
      name: 'Blue Light Filter',
      slug: 'blue-light-filter',
      type: 'blue_light',
      description: 'Filters harmful blue light from screens',
      price_adjustment: 40.00,
      is_active: true
    }
  });

  const coatingUV = await prisma.lensCoating.create({
    data: {
      name: 'UV Protection',
      slug: 'uv-protection',
      type: 'uv',
      description: '100% UV protection',
      price_adjustment: 20.00,
      is_active: true
    }
  });

  const coatingScratch = await prisma.lensCoating.create({
    data: {
      name: 'Scratch Resistant',
      slug: 'scratch-resistant',
      type: 'scratch',
      description: 'Hard coating for scratch resistance',
      price_adjustment: 25.00,
      is_active: true
    }
  });

  // Create Products
  console.log('🛍️ Creating products...');
  const product1 = await prisma.product.create({
    data: {
      name: 'Classic Round Frame',
      slug: 'classic-round-frame',
      sku: 'PRD-001',
      description: 'Timeless round frame design perfect for any face shape. Made with premium acetate material.',
      short_description: 'Classic round frame with premium quality',
      category_id: category1.id,
      price: 129.99,
      compare_at_price: 159.99,
      stock_quantity: 50,
      stock_status: 'in_stock',
      images: JSON.stringify([
        'https://example.com/images/round-frame-1.jpg',
        'https://example.com/images/round-frame-2.jpg'
      ]),
      frame_shape: 'round',
      frame_material: 'acetate',
      frame_color: 'Black',
      gender: 'unisex',
      lens_type: 'prescription',
      lens_index_options: JSON.stringify([1.56, 1.61, 1.67, 1.74]),
      treatment_options: JSON.stringify(['ar', 'blue_light', 'uv', 'scratch']),
      is_featured: true,
      is_active: true,
      rating: 4.5,
      review_count: 12
    }
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Aviator Sunglasses',
      slug: 'aviator-sunglasses',
      sku: 'PRD-002',
      description: 'Classic aviator style sunglasses with UV protection. Perfect for outdoor activities.',
      short_description: 'Classic aviator sunglasses',
      category_id: category2.id,
      price: 89.99,
      compare_at_price: 119.99,
      stock_quantity: 30,
      stock_status: 'in_stock',
      images: JSON.stringify([
        'https://example.com/images/aviator-1.jpg',
        'https://example.com/images/aviator-2.jpg'
      ]),
      frame_shape: 'aviator',
      frame_material: 'metal',
      frame_color: 'Gold',
      gender: 'unisex',
      lens_type: 'sunglasses',
      is_featured: true,
      is_active: true,
      rating: 4.8,
      review_count: 8
    }
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Square Reading Glasses',
      slug: 'square-reading-glasses',
      sku: 'PRD-003',
      description: 'Comfortable square reading glasses with blue light filter. Ideal for computer work.',
      short_description: 'Square reading glasses with blue light protection',
      category_id: category3.id,
      price: 49.99,
      stock_quantity: 75,
      stock_status: 'in_stock',
      images: JSON.stringify([
        'https://example.com/images/reading-1.jpg'
      ]),
      frame_shape: 'square',
      frame_material: 'tr90',
      frame_color: 'Tortoise',
      gender: 'unisex',
      lens_type: 'reading',
      treatment_options: JSON.stringify(['blue_light', 'uv']),
      is_featured: false,
      is_active: true,
      rating: 4.2,
      review_count: 5
    }
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Cat-Eye Fashion Frame',
      slug: 'cat-eye-fashion-frame',
      sku: 'PRD-004',
      description: 'Stylish cat-eye frame for a retro look. Perfect for fashion-forward individuals.',
      short_description: 'Fashionable cat-eye frame',
      category_id: category1.id,
      price: 149.99,
      compare_at_price: 179.99,
      stock_quantity: 25,
      stock_status: 'in_stock',
      images: JSON.stringify([
        'https://example.com/images/cateye-1.jpg',
        'https://example.com/images/cateye-2.jpg'
      ]),
      frame_shape: 'cat_eye',
      frame_material: 'acetate',
      frame_color: 'Red',
      gender: 'women',
      lens_type: 'prescription',
      lens_index_options: JSON.stringify([1.56, 1.61, 1.67]),
      treatment_options: JSON.stringify(['ar', 'blue_light', 'uv', 'scratch']),
      is_featured: true,
      is_active: true,
      rating: 4.7,
      review_count: 15
    }
  });

  // Create Frame Sizes
  console.log('📏 Creating frame sizes...');
  await prisma.frameSize.createMany({
    data: [
      {
        product_id: product1.id,
        lens_width: 52,
        bridge_width: 18,
        temple_length: 140,
        frame_width: 140,
        frame_height: 45,
        size_label: 'Medium'
      },
      {
        product_id: product1.id,
        lens_width: 54,
        bridge_width: 18,
        temple_length: 145,
        frame_width: 145,
        frame_height: 47,
        size_label: 'Large'
      },
      {
        product_id: product2.id,
        lens_width: 58,
        bridge_width: 16,
        temple_length: 140,
        frame_width: 150,
        frame_height: 50,
        size_label: 'One Size'
      },
      {
        product_id: product3.id,
        lens_width: 50,
        bridge_width: 20,
        temple_length: 135,
        frame_width: 135,
        frame_height: 40,
        size_label: 'Small'
      },
      {
        product_id: product4.id,
        lens_width: 52,
        bridge_width: 18,
        temple_length: 140,
        frame_width: 140,
        frame_height: 42,
        size_label: 'Medium'
      }
    ]
  });

  // Link Products to Lens Types
  console.log('🔗 Linking products to lens types...');
  await prisma.productLensType.createMany({
    data: [
      { product_id: product1.id, lens_type_id: lensType156.id },
      { product_id: product1.id, lens_type_id: lensType161.id },
      { product_id: product1.id, lens_type_id: lensType167.id },
      { product_id: product1.id, lens_type_id: lensType174.id },
      { product_id: product4.id, lens_type_id: lensType156.id },
      { product_id: product4.id, lens_type_id: lensType161.id },
      { product_id: product4.id, lens_type_id: lensType167.id }
    ]
  });

  // Link Products to Lens Coatings
  console.log('🔗 Linking products to lens coatings...');
  await prisma.productLensCoating.createMany({
    data: [
      { product_id: product1.id, lens_coating_id: coatingAR.id },
      { product_id: product1.id, lens_coating_id: coatingBlue.id },
      { product_id: product1.id, lens_coating_id: coatingUV.id },
      { product_id: product1.id, lens_coating_id: coatingScratch.id },
      { product_id: product3.id, lens_coating_id: coatingBlue.id },
      { product_id: product3.id, lens_coating_id: coatingUV.id },
      { product_id: product4.id, lens_coating_id: coatingAR.id },
      { product_id: product4.id, lens_coating_id: coatingBlue.id },
      { product_id: product4.id, lens_coating_id: coatingUV.id }
    ]
  });

  // Create Prescription
  console.log('👓 Creating prescription...');
  const prescription = await prisma.prescription.create({
    data: {
      user_id: customer.id,
      prescription_type: 'single_vision',
      od_sphere: -2.50,
      od_cylinder: -0.75,
      od_axis: 180,
      os_sphere: -2.25,
      os_cylinder: -0.50,
      os_axis: 5,
      pd_binocular: 64,
      pd_monocular_od: 32,
      pd_monocular_os: 32,
      is_active: true,
      is_verified: true
    }
  });

  // Create Cart
  console.log('🛒 Creating cart...');
  const cart = await prisma.cart.create({
    data: {
      user_id: customer.id,
      items: {
        create: [
          {
            product_id: product1.id,
            quantity: 1,
            unit_price: 129.99,
            lens_index: 1.61
          },
          {
            product_id: product4.id,
            quantity: 1,
            unit_price: 149.99
          }
        ]
      }
    }
  });

  // Create Reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.createMany({
    data: [
      {
        user_id: customer.id,
        product_id: product1.id,
        rating: 5,
        title: 'Great quality!',
        comment: 'These glasses are perfect. Very comfortable and stylish.',
        is_verified_purchase: true,
        is_approved: true,
        helpful_count: 3
      },
      {
        user_id: customer.id,
        product_id: product2.id,
        rating: 4,
        title: 'Good sunglasses',
        comment: 'Nice aviator style, good UV protection.',
        is_verified_purchase: true,
        is_approved: true,
        helpful_count: 1
      }
    ]
  });

  // Create Simulation Configs
  console.log('⚙️ Creating simulation configs...');
  await prisma.simulationConfig.createMany({
    data: [
      {
        config_key: 'pd_calculator_default',
        config_value: JSON.stringify({
          near_pd_offset: 3,
          min_pd: 50,
          max_pd: 80
        }),
        description: 'Default PD calculator settings',
        category: 'pd_calculator',
        is_active: true
      },
      {
        config_key: 'lens_thickness_formula',
        config_value: JSON.stringify({
          formula: 'edge_thickness = (frame_diameter² × lens_power) / (2000 × index)',
          min_diameter: 30,
          max_diameter: 80
        }),
        description: 'Lens thickness calculation formula',
        category: 'lens_thickness',
        is_active: true
      },
      {
        config_key: 'photochromic_settings',
        config_value: JSON.stringify({
          min_opacity: 0.1,
          max_opacity: 0.8,
          transition_time: 30
        }),
        description: 'Photochromic lens simulation settings',
        category: 'photochromic',
        is_active: true
      }
    ]
  });

  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('📝 Test Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@optyshop.com');
  console.log('     Password: admin123');
  console.log('');
  console.log('   Customer:');
  console.log('     Email: customer@test.com');
  console.log('     Password: customer123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

