const Joi = require('joi');
const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { formConfigs: fallbackFormConfigs } = require('../data/dynamicContent');

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
    message: Joi.string().allow('', null)
  }).unknown(true),
  demo: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    company: Joi.string().required(),
    teamSize: Joi.string().allow('', null),
    focus: Joi.string().allow('', null)
  }).unknown(true),
  pricing: Joi.object({
    email: Joi.string().email().required(),
    company: Joi.string().required(),
    monthlyTraffic: Joi.string().allow('', null),
    skuCount: Joi.string().allow('', null),
    priority: Joi.string().allow('', null)
  }).unknown(true),
  'job-application': Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    linkedIn: Joi.string().uri().allow('', null),
    portfolio: Joi.string().uri().allow('', null),
    coverLetter: Joi.string().allow('', null)
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

// @route   POST /api/forms/:name/submissions
// @access  Public
exports.submitForm = asyncHandler(async (req, res) => {
  const name = req.params.name.toLowerCase();
  const schema = formSchemas[name];

  if (!schema && !fallbackFormConfigs[name]) {
    return error(res, 'Form not supported', 404);
  }

  const { value, error: validationError } = schema
    ? schema.validate(req.body, { abortEarly: false })
    : { value: req.body, error: null };

  if (validationError) {
    return error(res, 'Validation failed', 400, {
      issues: validationError.details.map((d) => d.message)
    });
  }

  let formConfigRecord = null;
  try {
    formConfigRecord = await prisma.formConfig.findUnique({ where: { name } });
  } catch (err) {
    console.warn('FormConfig lookup during submission failed. Details:', err.message);
  }

  try {
    const submission = await prisma.formSubmission.create({
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

    return success(res, 'Submission received', submission, 201);
  } catch (err) {
    console.error('Unable to persist form submission:', err.message);
    return error(
      res,
      'Storage not ready for submissions. Please run Prisma migrations and try again.',
      503
    );
  }
});


