const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get user prescriptions
// @route   GET /api/prescriptions
// @access  Private
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    where: { user_id: req.user.id },
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Prescriptions retrieved successfully', { prescriptions });
});

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
exports.getPrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  if (!prescription) {
    return error(res, 'Prescription not found', 404);
  }

  return success(res, 'Prescription retrieved successfully', { prescription });
});

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private
exports.createPrescription = asyncHandler(async (req, res) => {
  const {
    prescription_type,
    od_sphere,
    od_cylinder,
    od_axis,
    od_add,
    os_sphere,
    os_cylinder,
    os_axis,
    os_add,
    pd_binocular,
    pd_monocular_od,
    pd_monocular_os,
    pd_near,
    ph_od,
    ph_os,
    doctor_name,
    doctor_license,
    prescription_date,
    expiry_date,
    notes
  } = req.body;

  const prescription = await prisma.prescription.create({
    data: {
      user_id: req.user.id,
      prescription_type: prescription_type || 'single_vision',
      od_sphere: od_sphere || null,
      od_cylinder: od_cylinder || null,
      od_axis: od_axis || null,
      od_add: od_add || null,
      os_sphere: os_sphere || null,
      os_cylinder: os_cylinder || null,
      os_axis: os_axis || null,
      os_add: os_add || null,
      pd_binocular: pd_binocular || null,
      pd_monocular_od: pd_monocular_od || null,
      pd_monocular_os: pd_monocular_os || null,
      pd_near: pd_near || null,
      ph_od: ph_od || null,
      ph_os: ph_os || null,
      doctor_name: doctor_name || null,
      doctor_license: doctor_license || null,
      prescription_date: prescription_date ? new Date(prescription_date) : null,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
      notes: notes || null,
      is_active: true
    }
  });

  return success(res, 'Prescription created successfully', { prescription }, 201);
});

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private
exports.updatePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  if (!prescription) {
    return error(res, 'Prescription not found', 404);
  }

  // Update allowed fields
  const updateData = {};
  const allowedFields = [
    'prescription_type',
    'od_sphere', 'od_cylinder', 'od_axis', 'od_add',
    'os_sphere', 'os_cylinder', 'os_axis', 'os_add',
    'pd_binocular', 'pd_monocular_od', 'pd_monocular_os', 'pd_near',
    'ph_od', 'ph_os',
    'doctor_name', 'doctor_license',
    'prescription_date', 'expiry_date',
    'notes', 'is_active'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'prescription_date' || field === 'expiry_date') {
        updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  const updatedPrescription = await prisma.prescription.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Prescription updated successfully', { prescription: updatedPrescription });
});

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private
exports.deletePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  if (!prescription) {
    return error(res, 'Prescription not found', 404);
  }

  await prisma.prescription.delete({ where: { id: parseInt(id) } });

  return success(res, 'Prescription deleted successfully');
});

// @desc    Validate prescription (Admin)
// @route   POST /api/prescriptions/validate
// @access  Private/Admin
exports.validatePrescription = asyncHandler(async (req, res) => {
  const { od_sphere, os_sphere, od_cylinder, os_cylinder, pd_binocular } = req.body;
  const issues = [];

  // Check for extreme power
  if (Math.abs(od_sphere) > 10 || Math.abs(os_sphere) > 10) {
    issues.push('Sphere power is unusually high (> 10.00)');
  }

  // Check for cylinder
  if (Math.abs(od_cylinder) > 6 || Math.abs(os_cylinder) > 6) {
    issues.push('Cylinder power is unusually high (> 6.00)');
  }

  // Check PD
  if (pd_binocular && (pd_binocular < 50 || pd_binocular > 80)) {
    issues.push('PD is outside typical adult range (50-80mm)');
  }

  if (issues.length > 0) {
    return success(res, 'Prescription validation completed with warnings', { valid: false, issues });
  }

  return success(res, 'Prescription appears valid', { valid: true });
});

// @desc    Verify prescription (Admin)
// @route   PUT /api/prescriptions/:id/verify
// @access  Private/Admin
exports.verifyPrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if prescription exists
  const existingPrescription = await prisma.prescription.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingPrescription) {
    return error(res, 'Prescription not found', 404);
  }

  const prescription = await prisma.prescription.update({
    where: { id: parseInt(id) },
    data: { is_verified: true }
  });

  return success(res, 'Prescription verified successfully', { prescription });
});
