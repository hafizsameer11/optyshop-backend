const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllProducts,
  getSunglassesProducts,
  getEyeglassesProducts,
  getContactLensesProducts,
  getEyeHygieneProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllSizeVolumeVariants,
  getSizeVolumeVariant,
  createSizeVolumeVariant,
  updateSizeVolumeVariant,
  deleteSizeVolumeVariant,
  bulkUpdateSizeVolumeVariants,
  getAllUsers,
  createUser,
  updateUser,
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllSubCategories,
  getSubCategory,
  getSubCategoriesByParent,
  getTopLevelSubCategories,
  getNestedSubCategories,
  getAvailableParentSubcategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAllFrameSizes,
  getFrameSize,
  createFrameSize,
  updateFrameSize,
  deleteFrameSize,
  getAllLensTypes,
  getLensType,
  createLensType,
  updateLensType,
  deleteLensType,
  getAllLensCoatings,
  getLensCoating,
  createLensCoating,
  updateLensCoating,
  deleteLensCoating,
  bulkUploadProducts,
} = require('../controllers/adminController');
const {
  getAllOrdersAdmin,
  getAdminOrderDetail
} = require('../controllers/orderController');
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCampaignsAdmin,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getBrandsAdmin,
  getBrandAdmin,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/marketingController');
const {
  getFlashOffersAdmin,
  getFlashOfferById,
  createFlashOffer,
  updateFlashOffer,
  deleteFlashOffer
} = require('../controllers/flashOfferController');
const {
  getProductGiftsAdmin,
  getProductGiftById,
  createProductGift,
  updateProductGift,
  deleteProductGift
} = require('../controllers/productGiftController');
const {
  getBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  getBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  getPagesAdmin,
  createPage,
  updatePage,
  deletePage,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/cmsController');
const {
  getSimulationConfig,
  updateSimulationConfig,
  getVtoConfigs,
  createVtoConfig,
  updateVtoConfig,
  deleteVtoConfig
} = require('../controllers/simulationController');
const {
  getAllJobsAdmin,
  getJobAdmin,
  createJob,
  updateJob,
  deleteJob,
  getAllJobApplications,
  getJobApplication,
  acceptJobApplication,
  rejectJobApplication,
  updateJobApplicationStatus,
  deleteJobApplication
} = require('../controllers/jobController');
const {
  getContactRequests,
  getContactRequest,
  deleteContactRequest,
  getDemoRequests,
  getDemoRequest,
  deleteDemoRequest,
  getPricingRequests,
  getPricingRequest,
  deletePricingRequest,
  getCredentialsRequests,
  getCredentialsRequest,
  deleteCredentialsRequest,
  getSupportRequests,
  getSupportRequest,
  deleteSupportRequest
} = require('../controllers/requestsController');
const {
  getAllTransactions,
  getTransactionAdmin,
  createTransaction,
  updateTransactionStatus,
  getTransactionStats
} = require('../controllers/transactionController');
const {
  getAllShippingMethods,
  getShippingMethodAdmin,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod
} = require('../controllers/shippingController');
const {
  getAllLensOptions,
  createLensOption,
  updateLensOption,
  deleteLensOption,
  getAllLensColors,
  createLensColor,
  updateLensColor,
  deleteLensColor,
  getAllLensTreatments,
  createLensTreatment,
  updateLensTreatment,
  deleteLensTreatment,
  getAllLensFinishes,
  createLensFinish,
  updateLensFinish,
  deleteLensFinish
} = require('../controllers/lensController');
const {
  getAllPrescriptionLensTypes,
  createPrescriptionLensType,
  updatePrescriptionLensType,
  deletePrescriptionLensType
} = require('../controllers/prescriptionLensTypeController');
const {
  getAllPrescriptionLensVariants,
  createPrescriptionLensVariant,
  updatePrescriptionLensVariant,
  deletePrescriptionLensVariant
} = require('../controllers/prescriptionLensVariantController');
const {
  getAllLensThicknessMaterials,
  createLensThicknessMaterial,
  updateLensThicknessMaterial,
  deleteLensThicknessMaterial,
  getAllLensThicknessOptions,
  createLensThicknessOption,
  updateLensThicknessOption,
  deleteLensThicknessOption
} = require('../controllers/lensThicknessController');
const {
  getAllPrescriptionSunLenses,
  createPrescriptionSunLens,
  updatePrescriptionSunLens,
  deletePrescriptionSunLens
} = require('../controllers/prescriptionSunLensController');
const {
  getAllPhotochromicLenses,
  createPhotochromicLens,
  updatePhotochromicLens,
  deletePhotochromicLens
} = require('../controllers/photochromicLensController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple, uploadSingle, uploadFields, uploadProductFiles } = require('../middleware/upload');
const {
  validateCreateProduct,
  validateUpdateProduct
} = require('../validators/productValidator');

// All admin routes require authentication and admin/staff role
router.use(protect);
router.use(authorize('admin', 'staff'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', getAllProducts);
// Section-specific product endpoints
router.get('/products/section/sunglasses', getSunglassesProducts);
router.get('/products/section/eyeglasses', getEyeglassesProducts);
router.get('/products/section/contact-lenses', getContactLensesProducts);
router.get('/products/section/eye-hygiene', getEyeHygieneProducts);
router.get('/products/:id', getProduct);
router.post('/products',
  uploadProductFiles(),
  validateCreateProduct,
  createProduct
);
router.put('/products/:id',
  uploadProductFiles(),
  validateUpdateProduct,
  updateProduct
);
router.delete('/products/:id', deleteProduct);
router.post('/products/bulk-upload', uploadSingle('file'), bulkUploadProducts);

// Size/Volume Variants (for Eye Hygiene products)
router.get('/products/:productId/size-volume-variants', getAllSizeVolumeVariants);
router.get('/products/:productId/size-volume-variants/:variantId', getSizeVolumeVariant);
router.post('/products/:productId/size-volume-variants', createSizeVolumeVariant);
router.put('/products/:productId/size-volume-variants/:variantId', updateSizeVolumeVariant);
router.delete('/products/:productId/size-volume-variants/:variantId', deleteSizeVolumeVariant);
router.put('/products/:productId/size-volume-variants/bulk', bulkUpdateSizeVolumeVariants);

// Frame Sizes
router.get('/frame-sizes', getAllFrameSizes);
router.get('/frame-sizes/:id', getFrameSize);
router.post('/frame-sizes', createFrameSize);
router.put('/frame-sizes/:id', updateFrameSize);
router.delete('/frame-sizes/:id', deleteFrameSize);

// Lens Types
router.get('/lens-types', getAllLensTypes);
router.get('/lens-types/:id', getLensType);
router.post('/lens-types', createLensType);
router.put('/lens-types/:id', updateLensType);
router.delete('/lens-types/:id', deleteLensType);

// Lens Coatings
router.get('/lens-coatings', getAllLensCoatings);
router.get('/lens-coatings/:id', getLensCoating);
router.post('/lens-coatings', createLensCoating);
router.put('/lens-coatings/:id', updateLensCoating);
router.delete('/lens-coatings/:id', deleteLensCoating);

// Orders
router.get('/orders', getAllOrdersAdmin);
router.get('/orders/:id', getAdminOrderDetail);

// Users
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);

// Categories
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategory);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Subcategories
router.get('/subcategories', getAllSubCategories);
router.get('/subcategories/top-level', getTopLevelSubCategories);
router.get('/subcategories/nested', getNestedSubCategories);
router.get('/subcategories/available-parents/:category_id', getAvailableParentSubcategories); // Get available parent subcategories for nested creation
router.get('/subcategories/by-parent/:parent_id', getSubCategoriesByParent);
router.get('/subcategories/:id', getSubCategory);
router.post('/subcategories', uploadSingle('image'), createSubCategory); // Supports nested subcategories via parent_id
router.put('/subcategories/:id', uploadSingle('image'), updateSubCategory);
router.delete('/subcategories/:id', deleteSubCategory);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Campaigns
router.get('/campaigns', getCampaignsAdmin);
router.post('/campaigns', uploadSingle('image'), createCampaign);
router.put('/campaigns/:id', uploadSingle('image'), updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// Flash Offers
router.get('/flash-offers', getFlashOffersAdmin);
router.get('/flash-offers/:id', getFlashOfferById);
router.post('/flash-offers', uploadSingle('image'), createFlashOffer);
router.put('/flash-offers/:id', uploadSingle('image'), updateFlashOffer);
router.delete('/flash-offers/:id', deleteFlashOffer);

// Product Gifts
router.get('/product-gifts', getProductGiftsAdmin);
router.get('/product-gifts/:id', getProductGiftById);
router.post('/product-gifts', createProductGift);
router.put('/product-gifts/:id', updateProductGift);
router.delete('/product-gifts/:id', deleteProductGift);

// Brands
router.get('/brands', getBrandsAdmin);
router.get('/brands/:id', getBrandAdmin);
router.post('/brands', uploadSingle('logo'), createBrand);
router.put('/brands/:id', uploadSingle('logo'), updateBrand);
router.delete('/brands/:id', deleteBrand);

// Banners
router.get('/banners', getBannersAdmin);
router.post('/banners', uploadSingle('image'), createBanner);
router.put('/banners/:id', uploadSingle('image'), updateBanner);
router.delete('/banners/:id', deleteBanner);

// Blog Posts
router.get('/blog-posts', getBlogPostsAdmin);
router.post('/blog-posts', uploadSingle('thumbnail'), createBlogPost);
router.put('/blog-posts/:id', uploadSingle('thumbnail'), updateBlogPost);
router.delete('/blog-posts/:id', deleteBlogPost);

// FAQs
router.get('/faqs', getFaqsAdmin);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

// Pages
router.get('/pages', getPagesAdmin);
router.post('/pages', createPage);
router.put('/pages/:id', updatePage);
router.delete('/pages/:id', deletePage);

// Testimonials
router.get('/testimonials', getTestimonials);
router.post('/testimonials', uploadSingle('avatar'), createTestimonial);
router.put('/testimonials/:id', uploadSingle('avatar'), updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Jobs
router.get('/jobs', getAllJobsAdmin);
router.get('/jobs/:id', getJobAdmin);
router.post('/jobs', createJob);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Job Applications
router.get('/job-applications', getAllJobApplications);
router.get('/job-applications/:id', getJobApplication);
router.put('/job-applications/:id/accept', acceptJobApplication);
router.put('/job-applications/:id/reject', rejectJobApplication);
router.put('/job-applications/:id/status', updateJobApplicationStatus);
router.delete('/job-applications/:id', deleteJobApplication);

// Contact Requests
router.get('/requests/contact', getContactRequests);
router.get('/requests/contact/:id', getContactRequest);
router.delete('/requests/contact/:id', deleteContactRequest);

// Demo Requests
router.get('/requests/demo', getDemoRequests);
router.get('/requests/demo/:id', getDemoRequest);
router.delete('/requests/demo/:id', deleteDemoRequest);

// Pricing Requests
router.get('/requests/pricing', getPricingRequests);
router.get('/requests/pricing/:id', getPricingRequest);
router.delete('/requests/pricing/:id', deletePricingRequest);

// Credentials Requests
router.get('/requests/credentials', getCredentialsRequests);
router.get('/requests/credentials/:id', getCredentialsRequest);
router.delete('/requests/credentials/:id', deleteCredentialsRequest);

// Support Requests
router.get('/requests/support', getSupportRequests);
router.get('/requests/support/:id', getSupportRequest);
router.delete('/requests/support/:id', deleteSupportRequest);

// Transactions
router.get('/transactions', getAllTransactions);
router.get('/transactions/stats', getTransactionStats);
router.get('/transactions/:id', getTransactionAdmin);
router.post('/transactions', createTransaction);
router.put('/transactions/:id/status', updateTransactionStatus);

// Shipping Methods
router.get('/shipping-methods', getAllShippingMethods);
router.get('/shipping-methods/:id', getShippingMethodAdmin);
router.post('/shipping-methods', createShippingMethod);
router.put('/shipping-methods/:id', updateShippingMethod);
router.delete('/shipping-methods/:id', deleteShippingMethod);

// Lens Options
router.get('/lens-options', getAllLensOptions);
router.post('/lens-options', createLensOption);
router.put('/lens-options/:id', updateLensOption);
router.delete('/lens-options/:id', deleteLensOption);

// Lens Colors
router.get('/lens-colors', getAllLensColors);
router.post('/lens-colors', createLensColor);
router.put('/lens-colors/:id', updateLensColor);
router.delete('/lens-colors/:id', deleteLensColor);

// Lens Treatments
router.get('/lens-treatments', getAllLensTreatments);
router.post('/lens-treatments', createLensTreatment);
router.put('/lens-treatments/:id', updateLensTreatment);
router.delete('/lens-treatments/:id', deleteLensTreatment);

// Lens Finishes
router.get('/lens-finishes', getAllLensFinishes);
router.post('/lens-finishes', createLensFinish);
router.put('/lens-finishes/:id', updateLensFinish);
router.delete('/lens-finishes/:id', deleteLensFinish);

// Prescription Lens Types
router.get('/prescription-lens-types', getAllPrescriptionLensTypes);
router.post('/prescription-lens-types', createPrescriptionLensType);
router.put('/prescription-lens-types/:id', updatePrescriptionLensType);
router.delete('/prescription-lens-types/:id', deletePrescriptionLensType);

// Prescription Lens Variants
router.get('/prescription-lens-variants', getAllPrescriptionLensVariants);
router.post('/prescription-lens-variants', createPrescriptionLensVariant);
router.put('/prescription-lens-variants/:id', updatePrescriptionLensVariant);
router.delete('/prescription-lens-variants/:id', deletePrescriptionLensVariant);

// Lens Thickness Materials
router.get('/lens-thickness-materials', getAllLensThicknessMaterials);
router.post('/lens-thickness-materials', createLensThicknessMaterial);
router.put('/lens-thickness-materials/:id', updateLensThicknessMaterial);
router.delete('/lens-thickness-materials/:id', deleteLensThicknessMaterial);

// Lens Thickness Options
router.get('/lens-thickness-options', getAllLensThicknessOptions);
router.post('/lens-thickness-options', createLensThicknessOption);
router.put('/lens-thickness-options/:id', updateLensThicknessOption);
router.delete('/lens-thickness-options/:id', deleteLensThicknessOption);


// Prescription Sun Lenses
router.get('/prescription-sun-lenses', getAllPrescriptionSunLenses);
router.post('/prescription-sun-lenses', createPrescriptionSunLens);
router.put('/prescription-sun-lenses/:id', updatePrescriptionSunLens);
router.delete('/prescription-sun-lenses/:id', deletePrescriptionSunLens);

// Photochromic Lenses
router.get('/photochromic-lenses', getAllPhotochromicLenses);
router.post('/photochromic-lenses', createPhotochromicLens);
router.put('/photochromic-lenses/:id', updatePhotochromicLens);
router.delete('/photochromic-lenses/:id', deletePhotochromicLens);

// Simulation Configs (aliases for frontend compatibility)
router.get('/configs', getSimulationConfig);
router.put('/configs', updateSimulationConfig);

// VTO Settings (aliases for frontend compatibility)
router.get('/vto-settings', getVtoConfigs);
router.post('/vto-settings', createVtoConfig);
router.put('/vto-settings/:id', updateVtoConfig);
router.delete('/vto-settings/:id', deleteVtoConfig);

module.exports = router;

