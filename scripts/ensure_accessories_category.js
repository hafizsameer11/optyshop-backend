/**
 * Ensure the Accessori category exists (matches live storefront /collections/accessori).
 * No subcategories required — products attach directly to this category.
 *
 * Run: node scripts/ensure_accessories_category.js
 */
const prisma = require('../lib/prisma');

async function main() {
  // Prefer the live slug used in production: accessori
  const category = await prisma.category.upsert({
    where: { slug: 'accessori' },
    update: {
      name: 'Accessori',
      description: 'Accessori per occhiali — custodie, kit di pulizia, utensili e cinghie',
      is_active: true,
    },
    create: {
      name: 'Accessori',
      slug: 'accessori',
      description: 'Accessori per occhiali — custodie, kit di pulizia, utensili e cinghie',
      is_active: true,
      sort_order: 10,
    },
  });

  // If an old English "accessories" row exists, leave it but log a hint
  const englishLegacy = await prisma.category.findUnique({ where: { slug: 'accessories' } });
  if (englishLegacy && englishLegacy.id !== category.id) {
    console.warn(
      '⚠️  Also found legacy slug "accessories" (id=%s). Prefer "accessori" for products and storefront.',
      englishLegacy.id
    );
  }

  console.log('✅ Accessori category ready:', {
    id: category.id,
    name: category.name,
    slug: category.slug,
    url: `/collections/${category.slug}`,
  });
}

main()
  .catch((err) => {
    console.error('❌ Failed to ensure Accessori category:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
