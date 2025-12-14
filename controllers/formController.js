const Joi = require('joi');
const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { formConfigs: fallbackFormConfigs } = require('../data/dynamicContent');
const { uploadToS3 } = require('../config/aws');

const normalizeConfig = (record) => ({
  id: record.id,
  name: record.name,
  title: record.title,
  description: record.description,
  ctaText: record.cta_text,
  fields: record.fields || [],
  meta: record.meta || {},
  isActive: record.is_active
});

const formSchemas = {
  contact: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    country: Joi.string().required(),
    company: Joi.string().required(),
    companyName: Joi.string().optional(), // Alternative field name
    message: Joi.string().required()
  }).unknown(true),
  demo: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    surname: Joi.string().required(),
    village: Joi.string().required(),
    company_name: Joi.string().required(),
    website_url: Joi.string().allow('', null).custom((value, helpers) => {
      // If empty, null, or undefined, allow it
      if (value === null || value === undefined || value === '') {
        return value === undefined ? null : value;
      }
      // If not empty, validate as URI
      try {
        new URL(value);
        return value;
      } catch {
        return helpers.error('string.uri', { value });
      }
    }).optional(),
    frames_in_catalog: Joi.string().allow('', null),
    message: Joi.string().allow('', null)
  }).unknown(true),
  pricing: Joi.object({
    email: Joi.string().email().required(),
    company: Joi.string().required(),
    monthlyTraffic: Joi.string().allow('', null),
    skuCount: Joi.string().allow('', null),
    priority: Joi.string().allow('', null)
  }).unknown(true),
  'job-application': Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    linkedInProfile: Joi.string().allow('', null).custom((value, helpers) => {
      if (value === null || value === undefined || value === '') {
        return value === undefined ? null : value;
      }
      try {
        new URL(value);
        return value;
      } catch {
        return helpers.error('string.uri', { value });
      }
    }).optional(),
    portfolioWebsite: Joi.string().allow('', null).custom((value, helpers) => {
      if (value === null || value === undefined || value === '') {
        return value === undefined ? null : value;
      }
      try {
        new URL(value);
        return value;
      } catch {
        return helpers.error('string.uri', { value });
      }
    }).optional(),
    resumeCv: Joi.string().required(),
    coverLetterFile: Joi.string().allow('', null).optional(),
    whyJoinMessage: Joi.string().required(),
    jobId: Joi.number().integer().optional()
  }).unknown(true),
  credentials: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required()
  }).unknown(true),
  support: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().allow('', null).optional(),
    solutionsConcerned: Joi.array().items(Joi.string()).optional(),
    message: Joi.string().required()
  }).unknown(true)
};

// @route   GET /api/forms/:name
// @access  Public
exports.getFormConfig = asyncHandler(async (req, res) => {
  const name = req.params.name.toLowerCase();

  let config = null;
  try {
    const record = await prisma.formConfig.findUnique({ where: { name } });
    if (record && record.is_active) {
      config = normalizeConfig(record);
    }
  } catch (err) {
    console.warn('FormConfig lookup failed, using fallback if available. Details:', err.message);
  }

  if (!config) {
    config = fallbackFormConfigs[name];
  }

  if (!config) {
    return error(res, 'Form config not found', 404);
  }

  return success(res, 'Form config retrieved successfully', config);
});

// @route   POST /api/forms/:name/submissions or POST /api/forms/support/submissions
// @access  Public
exports.submitForm = asyncHandler(async (req, res) => {
  // Handle support form which has a special route
  let name = req.params.name ? req.params.name.toLowerCase() : null;
  if (!name && req.path.includes('/support/submissions')) {
    name = 'support';
  }
  
  if (!name) {
    return error(res, 'Form name is required', 400);
  }
  const schema = formSchemas[name];

  // Debug: Log raw request info
  console.log('=== Form Submission Debug ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body type:', typeof req.body);
  console.log('Body is null?', req.body === null);
  console.log('Body is undefined?', req.body === undefined);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'N/A');
  console.log('Body value:', req.body);
  console.log('===========================');

  // Check if body is empty or not parsed
  if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0 && req.body.constructor === Object)) {
    console.error('Empty request body detected:', {
      contentType: req.headers['content-type'],
      method: req.method,
      url: req.url,
      body: req.body,
      bodyType: typeof req.body,
      rawBody: req.body
    });
    
    // Provide more helpful error message
    const contentType = req.headers['content-type'] || 'not set';
    let errorMsg = 'Request body is empty or not properly formatted. ';
    
    if (!contentType.includes('application/json')) {
      errorMsg += `Content-Type header is "${contentType}" but should be "application/json". `;
    }
    
    errorMsg += 'Please ensure: 1) Content-Type is set to application/json, 2) The request body contains valid JSON, 3) The body is not empty.';
    
    return error(res, errorMsg, 400, {
      contentType: contentType,
      expectedContentType: 'application/json',
      bodyReceived: req.body !== undefined && req.body !== null
    });
  }

  // Debug logging
  console.log('Form submission request received:', {
    formName: name,
    contentType: req.headers['content-type'],
    bodyKeys: Object.keys(req.body || {}),
    bodySample: JSON.stringify(req.body).substring(0, 200)
  });

  if (!schema && !fallbackFormConfigs[name]) {
    return error(res, 'Form not supported', 404);
  }

  const { value, error: validationError } = schema
    ? schema.validate(req.body, { abortEarly: false })
    : { value: req.body, error: null };

  if (validationError) {
    console.error('Validation error for form:', name);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Request body type:', typeof req.body);
    console.error('Request body keys:', Object.keys(req.body || {}));
    console.error('Validation details:', validationError.details.map((d) => ({
      path: d.path,
      message: d.message,
      type: d.type
    })));
    return error(res, 'Validation failed', 400, {
      issues: validationError.details.map((d) => d.message),
      receivedFields: Object.keys(req.body || {})
    });
  }

  let formConfigRecord = null;
  try {
    formConfigRecord = await prisma.formConfig.findUnique({ where: { name } });
  } catch (err) {
    console.warn('FormConfig lookup during submission failed. Details:', err.message);
  }

  try {
    let submission;

    if (name === 'demo') {
      submission = await prisma.demoRequest.create({
        data: {
          email: value.email,
          name: value.name,
          surname: value.surname,
          village: value.village,
          company_name: value.company_name,
          website_url: value.website_url,
          frames_in_catalog: value.frames_in_catalog,
          message: value.message
        },
        select: {
          id: true,
          created_at: true
        }
      });
    } else if (name === 'contact') {
      submission = await prisma.contactRequest.create({
        data: {
          email: value.email,
          first_name: value.firstName,
          last_name: value.lastName,
          country: value.country,
          company_name: value.company || value.companyName, // Support both field names
          message: value.message
        },
        select: {
          id: true,
          created_at: true
        }
      });
    } else if (name === 'job-application') {
      // Validate job_id if provided - ensure it exists before creating
      let validJobId = null;
      
      console.log('=== Job Application Processing ===');
      console.log('Received jobId:', value.jobId, 'Type:', typeof value.jobId);
      
      if (value.jobId !== undefined && value.jobId !== null && value.jobId !== '') {
        try {
          const jobId = typeof value.jobId === 'string' ? parseInt(value.jobId, 10) : Number(value.jobId);
          console.log('Parsed jobId:', jobId, 'IsNaN:', isNaN(jobId));
          
          if (!isNaN(jobId) && jobId > 0) {
            console.log('Checking if job exists with ID:', jobId);
            const job = await prisma.job.findUnique({
              where: { id: jobId },
              select: { id: true }
            });
            
            if (job) {
              validJobId = jobId;
              console.log(`✅ Valid job ID found: ${jobId}`);
            } else {
              console.warn(`⚠️ Job with ID ${jobId} NOT FOUND in database. Setting job_id to null.`);
              validJobId = null; // Explicitly set to null
            }
          } else {
            console.warn(`⚠️ Invalid job ID format: ${value.jobId}. Setting job_id to null.`);
            validJobId = null; // Explicitly set to null
          }
        } catch (err) {
          console.error(`❌ Error validating job ID ${value.jobId}:`, err.message);
          validJobId = null; // Explicitly set to null on error
        }
      } else {
        console.log('No jobId provided, setting job_id to null');
      }

      // Prepare data object - ALWAYS ensure job_id is null if invalid
      const applicationData = {
        job_id: validJobId, // Will be null if job doesn't exist or wasn't provided
        first_name: value.firstName,
        last_name: value.lastName,
        email: value.email,
        phone_number: value.phoneNumber,
        linkedin_profile: value.linkedInProfile || null,
        portfolio_website: value.portfolioWebsite || null,
        resume_cv: value.resumeCv,
        cover_letter_file: value.coverLetterFile || null,
        why_join_message: value.whyJoinMessage
      };

      console.log('📝 Creating job application with job_id:', applicationData.job_id);
      console.log('Application data (excluding message):', {
        job_id: applicationData.job_id,
        first_name: applicationData.first_name,
        last_name: applicationData.last_name,
        email: applicationData.email
      });

      try {
        submission = await prisma.jobApplication.create({
          data: applicationData,
          select: {
            id: true,
            created_at: true
          }
        });
        console.log('✅ Job application created successfully:', submission);
      } catch (createError) {
        console.error('❌ Error creating job application:', createError.code, createError.message);
        
        // If foreign key constraint fails, retry with job_id set to null
        if (createError.code === 'P2003') {
          console.warn(`⚠️ Foreign key constraint failed. Retrying with job_id set to null.`);
          applicationData.job_id = null;
          
          try {
            submission = await prisma.jobApplication.create({
              data: applicationData,
              select: {
                id: true,
                created_at: true
              }
            });
            console.log('✅ Job application created successfully after retry:', submission);
          } catch (retryError) {
            console.error('❌ Retry also failed:', retryError.message);
            throw retryError;
          }
        } else {
          // Re-throw if it's a different error
          throw createError;
        }
      }
      console.log('=== End Job Application Processing ===');
    } else if (name === 'credentials') {
      if (!prisma.credentialsRequest) {
        return error(res, 'CredentialsRequest model not available. Please run: npx prisma generate and npx prisma migrate dev', 503);
      }
      
      submission = await prisma.credentialsRequest.create({
        data: {
          email: value.email,
          first_name: value.firstName,
          last_name: value.lastName,
          phone_number: value.phoneNumber
        },
        select: {
          id: true,
          created_at: true
        }
      });
    } else if (name === 'support') {
      if (!prisma.supportRequest) {
        return error(res, 'SupportRequest model not available. Please run: npx prisma generate and npx prisma migrate dev', 503);
      }
      
      // Handle file uploads if present
      let attachments = null;
      if (req.files && req.files.length > 0) {
        try {
          const fileData = [];
          for (const file of req.files) {
            // Upload file to S3 or local storage
            const url = await uploadToS3(file, 'support-attachments');
            fileData.push({
              filename: file.originalname,
              url: url,
              size: file.size,
              mimetype: file.mimetype
            });
          }
          attachments = JSON.stringify(fileData);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return error(res, `File upload failed: ${uploadError.message}`, 500);
        }
      }

      // Handle solutions concerned (array or string)
      let solutionsConcerned = null;
      if (value.solutionsConcerned) {
        if (Array.isArray(value.solutionsConcerned)) {
          solutionsConcerned = JSON.stringify(value.solutionsConcerned);
        } else if (typeof value.solutionsConcerned === 'string') {
          solutionsConcerned = value.solutionsConcerned;
        }
      }

      submission = await prisma.supportRequest.create({
        data: {
          email: value.email,
          first_name: value.firstName,
          last_name: value.lastName,
          phone_number: value.phoneNumber || null,
          solutions_concerned: solutionsConcerned,
          message: value.message,
          attachments: attachments
        },
        select: {
          id: true,
          created_at: true
        }
      });
    } else {
      submission = await prisma.formSubmission.create({
        data: {
          form_name: name,
          form_config_id: formConfigRecord?.id || null,
          payload: value,
          meta: {
            userAgent: req.headers['user-agent'],
            referer: req.headers.referer || req.headers.referrer || null
          }
        },
        select: {
          id: true,
          created_at: true
        }
      });
    }

    return success(res, 'Submission received', submission, 201);
  } catch (err) {
    console.error('Unable to persist form submission:', err.message);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    });
    
    // Provide more specific error message
    let errorMessage = 'Unable to save form submission. ';
    if (err.code === 'P2002') {
      errorMessage += 'A record with this information already exists.';
    } else if (err.code === 'P2003') {
      errorMessage += 'Invalid reference (e.g., job_id does not exist).';
    } else if (err.code === 'P2025') {
      errorMessage += 'Record not found.';
    } else if (err.message && err.message.includes('Unknown model')) {
      errorMessage += 'Database model not found. Please run: npx prisma generate';
    } else {
      errorMessage += 'Please check server logs for details.';
    }
    
    return error(
      res,
      errorMessage,
      503,
      {
        errorCode: err.code,
        errorName: err.name,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    );
  }
});


