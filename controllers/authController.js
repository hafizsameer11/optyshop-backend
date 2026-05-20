const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { jwtSecret, jwtExpire, jwtRefreshSecret, jwtRefreshExpire } = require('../config/jwt');
const { sendPasswordResetEmail } = require('../utils/email');

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getFrontendBaseUrl() {
  const url = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
  return url.replace(/\/$/, '');
}

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, jwtRefreshSecret, {
    expiresIn: jwtRefreshExpire
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate role - prevent public registration from creating admin users
    // Allow admin registration only if ALLOW_ADMIN_REGISTRATION env variable is set to 'true'
    const allowAdminRegistration = process.env.ALLOW_ADMIN_REGISTRATION === 'true';
    const allowedRoles = allowAdminRegistration ? ["admin", "customer"] : ["customer"];
    
    // Set final role - use provided role or default to customer
    // Normalize role: trim whitespace and convert to lowercase
    let finalRole = role ? String(role).trim().toLowerCase() : "customer";
    
    // If role is provided but empty after trimming, default to customer
    if (!finalRole || finalRole === "") {
      finalRole = "customer";
    }
    
    // Security: Reject admin role during public registration (unless explicitly allowed via env)
    if (finalRole === "admin" && !allowAdminRegistration) {
      return res.status(403).json({
        success: false,
        message: 'Cannot register as admin. Admin users must be created by existing admins via /api/admin/users endpoint. Set ALLOW_ADMIN_REGISTRATION=true in .env for testing.',
        debug: {
          providedRole: role,
          finalRole: finalRole,
          allowAdminRegistration: allowAdminRegistration,
          envValue: process.env.ALLOW_ADMIN_REGISTRATION
        }
      });
    }
    
    // Validate role is in allowed list
    if (!allowedRoles.includes(finalRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role "${finalRole}". Allowed roles for registration: ${allowedRoles.join(", ")}`
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Registration Debug:', {
        providedRole: role,
        finalRole: finalRole,
        allowAdminRegistration: allowAdminRegistration,
        envValue: process.env.ALLOW_ADMIN_REGISTRATION
      });
    }

    // Create user with explicit role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone,
        role: finalRole // Explicitly set role (customer or admin based on validation)
      }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken }
    });

    // Remove password from response
    const { password: _, refresh_token: __, ...userData } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken }
    });

    // Remove password from response
    const { password: _, refresh_token: __, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret);

    // Find user
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: newRefreshToken }
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        email_verified: true,
        avatar: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refresh_token: null }
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        email_verified: true,
        avatar: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const genericMessage =
      'If an account exists with that email, you will receive password reset instructions shortly.';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_active) {
      return res.json({ success: true, message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetTokenHash,
        reset_password_expires: resetExpires
      }
    });

    const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${resetToken}`;
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      firstName: user.first_name,
      resetUrl
    });

    if (!emailResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[forgotPassword] Email not sent. Reset link (dev only):', resetUrl);
      } else {
        console.error('[forgotPassword] Failed to send email:', emailResult.message || emailResult.error);
        return res.status(503).json({
          success: false,
          message:
            'Unable to send reset email right now. Please try again later or contact support.'
        });
      }
    }

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

// @desc    Reset password with token from email
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const tokenHash = hashResetToken(String(token).trim());
    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: tokenHash,
        reset_password_expires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new password reset.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        refresh_token: null
      }
    });

    return res.json({
      success: true,
      message: 'Password reset successfully. You can sign in with your new password.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};
