const prisma = require('./lib/prisma');

async function testProductRelation() {
    try {
        console.log('--- Starting Product Relation Verification ---');

        // 1. Create a dummy category
        const category = await prisma.category.create({
            data: {
                name: 'Rel Test Category ' + Date.now(),
                slug: 'rel-test-category-' + Date.now()
            }
        });

        // 2. Create a dummy subcategory
        const subCategory = await prisma.subCategory.create({
            data: {
                category_id: category.id,
                name: 'Rel Test SubCategory ' + Date.now(),
                slug: 'rel-test-subcategory-' + Date.now()
            }
        });

        // 3. Create a dummy product linked to subcategory
        const product = await prisma.product.create({
            data: {
                name: 'Test Product ' + Date.now(),
                slug: 'test-product-' + Date.now(),
                sku: 'SKU-' + Date.now(),
                category_id: category.id,
                sub_category_id: subCategory.id,
                price: 99.99
            }
        });
        console.log('✅ Created Product linked to SubCategory');

        // 4. Verify via Product API (Filter)
        try {
            const response = await fetch(`http://localhost:5000/api/products?subCategory=${subCategory.slug}`);
            const data = await response.json();

            if (data.success && data.data.products.length > 0) {
                console.log('✅ Product filtered by subCategory passed');
                if (data.data.products[0].subCategory && data.data.products[0].subCategory.id === subCategory.id) {
                    console.log('✅ Product response includes subCategory details');
                } else {
                    console.error('❌ Product response missing subCategory details');
                }
            } else {
                console.error('❌ Product filtering failed', data);
            }
        } catch (e) {
            console.error('❌ Product API failed', e.message);
        }

        // 5. Verify via SubCategory API (Include Products)
        try {
            const response = await fetch(`http://localhost:5000/api/subcategories/${subCategory.id}?includeProducts=true`);
            const data = await response.json();

            if (data.success && data.data.subcategory.products && data.data.subcategory.products.length > 0) {
                console.log('✅ SubCategory includeProducts passed');
            } else {
                console.error('❌ SubCategory includeProducts failed', data);
            }
        } catch (e) {
            console.error('❌ SubCategory API failed', e.message);
        }

        // Cleanup
        await prisma.product.delete({ where: { id: product.id } });
        await prisma.subCategory.delete({ where: { id: subCategory.id } });
        await prisma.category.delete({ where: { id: category.id } });
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testProductRelation();
