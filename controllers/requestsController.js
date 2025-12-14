const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to format contact request
const formatContactRequest = (request) => ({
  id: request.id,
  email: request.email,
  firstName: request.first_name,
  lastName: request.last_name,
  fullName: `${request.first_name} ${request.last_name}`,
  country: request.country,
  companyName: request.company_name,
  message: request.message,
  createdAt: request.created_at
});

// Helper function to format demo request
const formatDemoRequest = (request) => ({
  id: request.id,
  email: request.email,
  name: request.name,
  surname: request.surname,
  fullName: `${request.name} ${request.surname}`,
  village: request.village,
  companyName: request.company_name,
  websiteUrl: request.website_url,
  framesInCatalog: request.frames_in_catalog,
  message: request.message,
  createdAt: request.created_at
});

// Helper function to format pricing request
const formatPricingRequest = (request) => {
  let payload = {};
  try {
    payload = typeof request.payload === 'string' 
      ? JSON.parse(request.payload) 
      : request.payload;
  } catch (e) {
    payload = {};
  }

  return {
    id: request.id,
    email: payload.email || '',
    company: payload.company || '',
    monthlyTraffic: payload.monthlyTraffic || null,
    skuCount: payload.skuCount || null,
    priority: payload.priority || null,
    payload: payload,
    createdAt: request.created_at
  };
};

// Helper function to format credentials request
const formatCredentialsRequest = (request) => ({
  id: request.id,
  email: request.email,
  firstName: request.first_name,
  lastName: request.last_name,
  fullName: `${request.first_name} ${request.last_name}`,
  phoneNumber: request.phone_number,
  createdAt: request.created_at
});

// Helper function to format support request
const formatSupportRequest = (request) => {
  let solutionsConcerned = null;
  let attachments = null;

  try {
    if (request.solutions_concerned) {
      solutionsConcerned = typeof request.solutions_concerned === 'string' 
        ? JSON.parse(request.solutions_concerned) 
        : request.solutions_concerned;
    }
  } catch (e) {
    solutionsConcerned = request.solutions_concerned;
  }

  try {
    if (request.attachments) {
      attachments = typeof request.attachments === 'string' 
        ? JSON.parse(request.attachments) 
        : request.attachments;
    }
  } catch (e) {
    attachments = request.attachments;
  }

  return {
    id: request.id,
    email: request.email,
    firstName: request.first_name,
    lastName: request.last_name,
    fullName: `${request.first_name} ${request.last_name}`,
    phoneNumber: request.phone_number,
    solutionsConcerned: solutionsConcerned,
    message: request.message,
    attachments: attachments,
    createdAt: request.created_at
  };
};


// ==================== CONTACT REQUESTS ====================

// @desc    Get all contact requests
// @route   GET /api/admin/requests/contact
// @access  Private/Admin
exports.getContactRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.contactRequest.findMany({
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Contact requests retrieved successfully', {
    requests: requests.map(formatContactRequest),
    count: requests.length
  });
});

// @desc    Get single contact request
// @route   GET /api/admin/requests/contact/:id
// @access  Private/Admin
exports.getContactRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await prisma.contactRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Contact request not found', 404);
  }

  return success(res, 'Contact request retrieved successfully', {
    request: formatContactRequest(request)
  });
});

// @desc    Delete contact request
// @route   DELETE /api/admin/requests/contact/:id
// @access  Private/Admin
exports.deleteContactRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await prisma.contactRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Contact request not found', 404);
  }

  await prisma.contactRequest.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Contact request deleted successfully');
});

// ==================== DEMO REQUESTS ====================

// @desc    Get all demo requests
// @route   GET /api/admin/requests/demo
// @access  Private/Admin
exports.getDemoRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.demoRequest.findMany({
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Demo requests retrieved successfully', {
    requests: requests.map(formatDemoRequest),
    count: requests.length
  });
});

// @desc    Get single demo request
// @route   GET /api/admin/requests/demo/:id
// @access  Private/Admin
exports.getDemoRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await prisma.demoRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Demo request not found', 404);
  }

  return success(res, 'Demo request retrieved successfully', {
    request: formatDemoRequest(request)
  });
});

// @desc    Delete demo request
// @route   DELETE /api/admin/requests/demo/:id
// @access  Private/Admin
exports.deleteDemoRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await prisma.demoRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Demo request not found', 404);
  }

  await prisma.demoRequest.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Demo request deleted successfully');
});

// ==================== PRICING REQUESTS ====================

// @desc    Get all pricing requests
// @route   GET /api/admin/requests/pricing
// @access  Private/Admin
exports.getPricingRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.formSubmission.findMany({
    where: {
      form_name: 'pricing'
    },
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Pricing requests retrieved successfully', {
    requests: requests.map(formatPricingRequest),
    count: requests.length
  });
});

// @desc    Get single pricing request
// @route   GET /api/admin/requests/pricing/:id
// @access  Private/Admin
exports.getPricingRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await prisma.formSubmission.findFirst({
    where: {
      id: parseInt(id),
      form_name: 'pricing'
    }
  });

  if (!request) {
    return error(res, 'Pricing request not found', 404);
  }

  return success(res, 'Pricing request retrieved successfully', {
    request: formatPricingRequest(request)
  });
});

// @desc    Delete pricing request
// @route   DELETE /api/admin/requests/pricing/:id
// @access  Private/Admin
exports.deletePricingRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await prisma.formSubmission.findFirst({
    where: {
      id: parseInt(id),
      form_name: 'pricing'
    }
  });

  if (!request) {
    return error(res, 'Pricing request not found', 404);
  }

  await prisma.formSubmission.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Pricing request deleted successfully');
});

// ==================== CREDENTIALS REQUESTS ====================

// @desc    Get all credentials requests
// @route   GET /api/admin/requests/credentials
// @access  Private/Admin
exports.getCredentialsRequests = asyncHandler(async (req, res) => {
  if (!prisma.credentialsRequest) {
    return error(res, 'CredentialsRequest model not available. Please run: npx prisma generate', 503);
  }
  
  const requests = await prisma.credentialsRequest.findMany({
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Credentials requests retrieved successfully', {
    requests: requests.map(formatCredentialsRequest),
    count: requests.length
  });
});

// @desc    Get single credentials request
// @route   GET /api/admin/requests/credentials/:id
// @access  Private/Admin
exports.getCredentialsRequest = asyncHandler(async (req, res) => {
  if (!prisma.credentialsRequest) {
    return error(res, 'CredentialsRequest model not available. Please run: npx prisma generate', 503);
  }
  
  const { id } = req.params;
  const request = await prisma.credentialsRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Credentials request not found', 404);
  }

  return success(res, 'Credentials request retrieved successfully', {
    request: formatCredentialsRequest(request)
  });
});

// @desc    Delete credentials request
// @route   DELETE /api/admin/requests/credentials/:id
// @access  Private/Admin
exports.deleteCredentialsRequest = asyncHandler(async (req, res) => {
  if (!prisma.credentialsRequest) {
    return error(res, 'CredentialsRequest model not available. Please run: npx prisma generate', 503);
  }
  
  const { id } = req.params;
  const request = await prisma.credentialsRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Credentials request not found', 404);
  }

  await prisma.credentialsRequest.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Credentials request deleted successfully');
});

// ==================== SUPPORT REQUESTS ====================

// @desc    Get all support requests
// @route   GET /api/admin/requests/support
// @access  Private/Admin
exports.getSupportRequests = asyncHandler(async (req, res) => {
  if (!prisma.supportRequest) {
    return error(res, 'SupportRequest model not available. Please run: npx prisma generate', 503);
  }
  
  const requests = await prisma.supportRequest.findMany({
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Support requests retrieved successfully', {
    requests: requests.map(formatSupportRequest),
    count: requests.length
  });
});

// @desc    Get single support request
// @route   GET /api/admin/requests/support/:id
// @access  Private/Admin
exports.getSupportRequest = asyncHandler(async (req, res) => {
  if (!prisma.supportRequest) {
    return error(res, 'SupportRequest model not available. Please run: npx prisma generate', 503);
  }
  
  const { id } = req.params;
  const request = await prisma.supportRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Support request not found', 404);
  }

  return success(res, 'Support request retrieved successfully', {
    request: formatSupportRequest(request)
  });
});

// @desc    Delete support request
// @route   DELETE /api/admin/requests/support/:id
// @access  Private/Admin
exports.deleteSupportRequest = asyncHandler(async (req, res) => {
  if (!prisma.supportRequest) {
    return error(res, 'SupportRequest model not available. Please run: npx prisma generate', 503);
  }
  
  const { id } = req.params;
  const request = await prisma.supportRequest.findUnique({
    where: { id: parseInt(id) }
  });

  if (!request) {
    return error(res, 'Support request not found', 404);
  }

  await prisma.supportRequest.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Support request deleted successfully');
});


