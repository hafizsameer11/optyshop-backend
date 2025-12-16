const prisma = require('./lib/prisma');

async function testSubCategories() {
    try {
        console.log('--- Starting SubCategory Verification ---');

        if (!prisma.subCategory) {
            console.error('❌ Prisma Client does not have SubCategory model. "prisma generate" likely failed.');
            console.log('💡 Attempting to access schema directly might fail if generation was incomplete.');
            // We can't proceed if the model doesn't exist on the client
            return;
        }

        // 1. Create a dummy category
        const category = await prisma.category.create({
            data: {
                name: 'Test Category ' + Date.now(),
                slug: 'test-category-' + Date.now(),
                description: 'Testing subcategories'
            }
        });
        console.log('✅ Created dummy Category:', category.id);

        // 2. Create a dummy subcategory
        const subCategory = await prisma.subCategory.create({
            data: {
                category_id: category.id,
                name: 'Test SubCategory ' + Date.now(),
                slug: 'test-subcategory-' + Date.now(),
                description: 'Testing subcategory retrieval'
            }
        });
        console.log('✅ Created dummy SubCategory:', subCategory.id);

        // 3. Test API Endpoint (List)
        try {
            // Assuming server is running on localhost:5000
            const response = await fetch(`http://localhost:5000/api/subcategories?category_id=${category.id}&limit=10`);

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                if (response.ok && data.success) {
                    console.log('✅ API List Response Status:', response.status);
                    console.log('✅ API List Response Data:', JSON.stringify(data.data, null, 2));

                    // Check if data matches format
                    if (data.data.subcategories && data.data.pagination) {
                        console.log('✅ Data format verification passed (subcategories array and pagination object present)');
                    } else {
                        console.error('❌ Data format verification failed');
                    }
                } else {
                    console.error('❌ API List Request Failed:', response.status, data);
                }
            } else {
                console.error('❌ API returned non-JSON response:', response.status, await response.text());
            }

        } catch (apiError) {
            console.error('❌ API Verification Failed (Is the server running?):', apiError.message);
            console.log('⚠️ Note: Ensure the server is running on port 5000 to verify the API endpoint.');
        }

        // 4. Test API Endpoint (Single by ID)
        try {
            const response = await fetch(`http://localhost:5000/api/subcategories/${subCategory.id}`);
            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                if (data.success && data.data.subcategory.id === subCategory.id) {
                    console.log('✅ API Get By ID verification passed');
                } else {
                    console.error('❌ API Get By ID returned error or mismatch', data);
                }
            } else {
                console.error('❌ API Get By ID returned non-JSON response');
            }

        } catch (e) {
            console.error('❌ API Get By ID failed', e.message);
        }

        // Cleanup
        await prisma.subCategory.delete({ where: { id: subCategory.id } });
        await prisma.category.delete({ where: { id: category.id } });
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Verification Script Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSubCategories();
