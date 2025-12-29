const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// ==================== ADMIN ROUTES FOR PRESCRIPTION FORM DROPDOWN VALUES ====================

// @desc    Get all Prescription Form dropdown values
// @route   GET /api/admin/prescription-forms/dropdown-values
// @access  Admin
exports.getPrescriptionFormDropdownValues = asyncHandler(async (req, res) => {
  const { field_type, eye_type, form_type } = req.query;

  const where = {};
  if (field_type) {
    where.field_type = field_type;
  }
  if (eye_type) {
    where.eye_type = eye_type;
  }
  if (form_type) {
    where.form_type = form_type;
  }

  const values = await prisma.prescriptionFormDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type
  const grouped = {
    pd: values.filter(v => v.field_type === 'pd'),
    sph: values.filter(v => v.field_type === 'sph'),
    cyl: values.filter(v => v.field_type === 'cyl'),
    axis: values.filter(v => v.field_type === 'axis'),
    h: values.filter(v => v.field_type === 'h'),
    year_of_birth: values.filter(v => v.field_type === 'year_of_birth'),
    select_option: values.filter(v => v.field_type === 'select_option')
  };

  return success(res, 'Prescription form dropdown values retrieved successfully', {
    values,
    grouped
  });
});

// @desc    Create Prescription Form dropdown value
// @route   POST /api/admin/prescription-forms/dropdown-values
// @access  Admin
exports.createPrescriptionFormDropdownValue = asyncHandler(async (req, res) => {
  const { field_type, value, label, eye_type, form_type, sort_order } = req.body;

  // Validate required fields
  if (!field_type || value === undefined || value === null || value === '') {
    return error(res, 'field_type and value are required', 400);
  }

  // Validate field_type
  const validFieldTypes = ['pd', 'sph', 'cyl', 'axis', 'h', 'year_of_birth', 'select_option'];
  if (!validFieldTypes.includes(field_type)) {
    return error(res, `field_type must be one of: ${validFieldTypes.join(', ')}`, 400);
  }

  // Validate eye_type if provided
  if (eye_type && !['left', 'right', 'both'].includes(eye_type)) {
    return error(res, 'eye_type must be one of: left, right, both', 400);
  }

  // Validate form_type if provided
  if (form_type && !['progressive', 'near_vision', 'distance_vision'].includes(form_type)) {
    return error(res, 'form_type must be one of: progressive, near_vision, distance_vision', 400);
  }

  const dropdownValue = await prisma.prescriptionFormDropdownValue.create({
    data: {
      field_type,
      value: String(value),
      label: label || null,
      eye_type: eye_type || null,
      form_type: form_type || null,
      sort_order: sort_order || 0
    }
  });

  return success(res, 'Prescription form dropdown value created successfully', {
    value: dropdownValue
  }, 201);
});

// @desc    Update Prescription Form dropdown value
// @route   PUT /api/admin/prescription-forms/dropdown-values/:id
// @access  Admin
exports.updatePrescriptionFormDropdownValue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, label, eye_type, form_type, sort_order, is_active } = req.body;

  // Check if value exists
  const existingValue = await prisma.prescriptionFormDropdownValue.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingValue) {
    return error(res, 'Dropdown value not found', 404);
  }

  // Prepare update data
  const updateData = {};
  if (value !== undefined && value !== null && value !== '') {
    updateData.value = String(value);
  }
  if (label !== undefined) updateData.label = label;
  if (eye_type !== undefined) {
    if (eye_type && !['left', 'right', 'both'].includes(eye_type)) {
      return error(res, 'eye_type must be one of: left, right, both', 400);
    }
    updateData.eye_type = eye_type || null;
  }
  if (form_type !== undefined) {
    if (form_type && !['progressive', 'near_vision', 'distance_vision'].includes(form_type)) {
      return error(res, 'form_type must be one of: progressive, near_vision, distance_vision', 400);
    }
    updateData.form_type = form_type || null;
  }
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_active !== undefined) updateData.is_active = is_active;

  const dropdownValue = await prisma.prescriptionFormDropdownValue.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Prescription form dropdown value updated successfully', {
    value: dropdownValue
  });
});

// @desc    Delete Prescription Form dropdown value
// @route   DELETE /api/admin/prescription-forms/dropdown-values/:id
// @access  Admin
exports.deletePrescriptionFormDropdownValue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dropdownValue = await prisma.prescriptionFormDropdownValue.findUnique({
    where: { id: parseInt(id) }
  });

  if (!dropdownValue) {
    return error(res, 'Dropdown value not found', 404);
  }

  await prisma.prescriptionFormDropdownValue.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Prescription form dropdown value deleted successfully');
});

// ==================== PUBLIC ROUTES ====================

// @desc    Get Prescription Form dropdown values (public)
// @route   GET /api/prescription-forms/dropdown-values
// @access  Public
exports.getPrescriptionFormDropdownValuesPublic = asyncHandler(async (req, res) => {
  const { field_type, eye_type, form_type } = req.query;

  const where = { is_active: true };
  if (field_type) {
    where.field_type = field_type;
  }
  if (eye_type) {
    where.eye_type = eye_type;
  }
  if (form_type) {
    where.form_type = form_type;
  }

  const values = await prisma.prescriptionFormDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type for easier frontend consumption
  const grouped = {
    pd: values.filter(v => v.field_type === 'pd'),
    sph: values.filter(v => v.field_type === 'sph'),
    cyl: values.filter(v => v.field_type === 'cyl'),
    axis: values.filter(v => v.field_type === 'axis'),
    h: values.filter(v => v.field_type === 'h'),
    year_of_birth: values.filter(v => v.field_type === 'year_of_birth'),
    select_option: values.filter(v => v.field_type === 'select_option')
  };

  return success(res, 'Prescription form dropdown values retrieved successfully', {
    values,
    grouped
  });
});

// @desc    Get Prescription Form structure (public)
// @route   GET /api/prescription-forms/:form_type
// @access  Public
exports.getPrescriptionFormStructure = asyncHandler(async (req, res) => {
  const { form_type } = req.params;

  // Validate form_type
  const validFormTypes = ['progressive', 'near_vision', 'distance_vision'];
  if (!validFormTypes.includes(form_type)) {
    return error(res, `form_type must be one of: ${validFormTypes.join(', ')}`, 400);
  }

  // Get all dropdown values for this form type
  const where = {
    is_active: true,
    OR: [
      { form_type: form_type },
      { form_type: null } // Values available for all forms
    ]
  };

  const values = await prisma.prescriptionFormDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type
  const grouped = {
    pd: values.filter(v => v.field_type === 'pd'),
    sph: values.filter(v => v.field_type === 'sph'),
    cyl: values.filter(v => v.field_type === 'cyl'),
    axis: values.filter(v => v.field_type === 'axis'),
    h: values.filter(v => v.field_type === 'h'),
    year_of_birth: values.filter(v => v.field_type === 'year_of_birth'),
    select_option: values.filter(v => v.field_type === 'select_option')
  };

  // Filter by eye type for SPH, CYL, AXIS
  const rightEyeFields = {
    sph: grouped.sph.filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both'),
    cyl: grouped.cyl.filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both'),
    axis: grouped.axis.filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
  };

  const leftEyeFields = {
    sph: grouped.sph.filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both'),
    cyl: grouped.cyl.filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both'),
    axis: grouped.axis.filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
  };

  return success(res, 'Prescription form structure retrieved successfully', {
    formType: form_type,
    dropdownValues: {
      pd: grouped.pd,
      h: grouped.h,
      year_of_birth: grouped.year_of_birth,
      select_option: grouped.select_option,
      rightEye: rightEyeFields,
      leftEye: leftEyeFields
    }
  });
});

// @desc    Submit Prescription Form with copy_left_to_right feature
// @route   POST /api/prescription-forms/submit
// @access  Public (or Private if authentication required)
exports.submitPrescriptionForm = asyncHandler(async (req, res) => {
  const {
    form_type,
    pd,
    pd_right,
    h,
    right_eye_sph,
    right_eye_cyl,
    right_eye_axis,
    left_eye_sph,
    left_eye_cyl,
    left_eye_axis,
    select_option,
    year_of_birth,
    copy_left_to_right, // New flag: if true, copy left eye values to right eye
    same_for_both_eyes // Alternative flag name for same functionality
  } = req.body;

  // Validate required fields
  if (!form_type) {
    return error(res, 'form_type is required', 400);
  }

  const validFormTypes = ['progressive', 'near_vision', 'distance_vision'];
  if (!validFormTypes.includes(form_type)) {
    return error(res, `form_type must be one of: ${validFormTypes.join(', ')}`, 400);
  }

  // Determine if we should copy left to right
  const shouldCopyLeftToRight = copy_left_to_right === true || same_for_both_eyes === true;

  // Prepare right eye values - copy from left if flag is set, otherwise use provided values
  let finalRightEyeSph = right_eye_sph;
  let finalRightEyeCyl = right_eye_cyl;
  let finalRightEyeAxis = right_eye_axis;

  if (shouldCopyLeftToRight) {
    // Copy left eye values to right eye
    finalRightEyeSph = left_eye_sph;
    finalRightEyeCyl = left_eye_cyl;
    finalRightEyeAxis = left_eye_axis;
  }

  // Here you would typically save the prescription data
  // For now, we'll just return the processed data
  const prescriptionData = {
    form_type,
    pd,
    pd_right,
    h,
    right_eye: {
      sph: finalRightEyeSph,
      cyl: finalRightEyeCyl,
      axis: finalRightEyeAxis
    },
    left_eye: {
      sph: left_eye_sph,
      cyl: left_eye_cyl,
      axis: left_eye_axis
    },
    select_option,
    year_of_birth,
    copied_left_to_right: shouldCopyLeftToRight
  };

  return success(res, 'Prescription form submitted successfully', {
    prescription: prescriptionData
  }, 201);
});

