const nodemailer = require('nodemailer');

const firstEnv = (...keys) => {
  for (const key of keys) {
    const val = process.env[key];
    if (val != null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
};

const createTransporter = () => {
  const smtpUrl = firstEnv('SMTP_URL', 'EMAIL_URL', 'MAIL_URL');
  if (smtpUrl) {
    return nodemailer.createTransport(smtpUrl);
  }

  const user = firstEnv('EMAIL_USER', 'SMTP_USER', 'MAIL_USER', 'SMTP_USERNAME');
  const pass = firstEnv('EMAIL_PASSWORD', 'EMAIL_PASS', 'SMTP_PASSWORD', 'SMTP_PASS', 'MAIL_PASSWORD').replace(
    /\s+/g,
    ''
  );
  const host = firstEnv('EMAIL_HOST', 'SMTP_HOST', 'MAIL_HOST');
  const service = firstEnv('EMAIL_SERVICE', 'SMTP_SERVICE');
  const portRaw = firstEnv('EMAIL_PORT', 'SMTP_PORT', 'MAIL_PORT');
  const port = parseInt(portRaw || '587', 10) || 587;
  const secureEnv = firstEnv('EMAIL_SECURE', 'SMTP_SECURE');
  const secure =
    secureEnv === 'true' ||
    secureEnv === '1' ||
    port === 465;

  if (!user || !pass) {
    return null;
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
      connectionTimeout: 15000,
    });
  }

  if (!host) {
    // Gmail account with no host set
    if (user.toLowerCase().includes('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 15000,
      });
    }
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    connectionTimeout: 15000,
  });
};

/**
 * Send email notification
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      'Email not configured. Set EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD (Gmail: use an App Password).'
    );
    return { success: false, message: 'Email not configured' };
  }

  const from =
    firstEnv('EMAIL_FROM', 'MAIL_FROM', 'SMTP_FROM') || firstEnv('EMAIL_USER', 'SMTP_USER');

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send cart notification to admin
 */
const sendCartNotificationToAdmin = async ({ customer, product, cartItem, shippingInfo, paymentInfo, coupon }) => {
  const adminEmail = firstEnv('ADMIN_EMAIL', 'EMAIL_USER');

  if (!adminEmail) {
    console.warn('Admin email not configured. Skipping cart notification.');
    return { success: false, message: 'Admin email not configured' };
  }

  const shippingDetails = shippingInfo ? `
    <h3>Shipping Information:</h3>
    <ul>
      <li><strong>First Name:</strong> ${shippingInfo.first_name || 'N/A'}</li>
      <li><strong>Last Name:</strong> ${shippingInfo.last_name || 'N/A'}</li>
      <li><strong>Email:</strong> ${shippingInfo.email || customer.email || 'N/A'}</li>
      <li><strong>Phone:</strong> ${shippingInfo.phone || 'N/A'}</li>
      <li><strong>Address:</strong> ${shippingInfo.address || 'N/A'}</li>
      <li><strong>City:</strong> ${shippingInfo.city || 'N/A'}</li>
      <li><strong>ZIP Code:</strong> ${shippingInfo.zip_code || 'N/A'}</li>
      <li><strong>Country:</strong> ${shippingInfo.country || 'N/A'}</li>
    </ul>
  ` : '';

  const paymentDetails = paymentInfo ? `
    <h3>Payment Information:</h3>
    <ul>
      <li><strong>Card Number:</strong> ${paymentInfo.card_number ? paymentInfo.card_number.replace(/\d(?=\d{4})/g, '*') : 'N/A'}</li>
      <li><strong>Cardholder Name:</strong> ${paymentInfo.cardholder_name || 'N/A'}</li>
      <li><strong>Expiry Date:</strong> ${paymentInfo.expiry_date || 'N/A'}</li>
      <li><strong>CVV:</strong> ${paymentInfo.cvv ? '***' : 'N/A'}</li>
    </ul>
  ` : '';

  const couponDetails = coupon ? `
    <h3>Coupon Applied:</h3>
    <ul>
      <li><strong>Code:</strong> ${coupon.code || 'N/A'}</li>
      <li><strong>Discount Type:</strong> ${coupon.discount_type || 'N/A'}</li>
      <li><strong>Discount Value:</strong> ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '$' + coupon.discount_value}</li>
      <li><strong>Discount Amount:</strong> $${parseFloat(coupon.discount_amount || 0).toFixed(2)}</li>
      ${coupon.free_shipping ? '<li><strong>Free Shipping:</strong> Yes</li>' : ''}
    </ul>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
        .info-item { margin: 10px 0; }
        .info-item strong { display: inline-block; width: 150px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Item Added to Cart</h1>
        </div>
        <div class="content">
          <div class="section">
            <h3>Customer Information</h3>
            <div class="info-item"><strong>Name:</strong> ${customer.first_name || ''} ${customer.last_name || ''}</div>
            <div class="info-item"><strong>Email:</strong> ${customer.email || 'N/A'}</div>
            <div class="info-item"><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
            <div class="info-item"><strong>User ID:</strong> ${customer.id || 'N/A'}</div>
          </div>
          <div class="section">
            <h3>Product Information</h3>
            <div class="info-item"><strong>Product Name:</strong> ${product.name || 'N/A'}</div>
            <div class="info-item"><strong>Product ID:</strong> ${product.id || 'N/A'}</div>
            <div class="info-item"><strong>SKU:</strong> ${product.sku || 'N/A'}</div>
            <div class="info-item"><strong>Price:</strong> $${parseFloat(product.price || 0).toFixed(2)}</div>
            <div class="info-item"><strong>Stock:</strong> ${product.stock_quantity || 0} available</div>
          </div>
          <div class="section">
            <h3>Cart Item Details</h3>
            <div class="info-item"><strong>Quantity:</strong> ${cartItem.quantity || 1}</div>
            <div class="info-item"><strong>Unit Price:</strong> $${parseFloat(cartItem.unit_price || 0).toFixed(2)}</div>
            <div class="info-item"><strong>Total Price:</strong> $${(parseFloat(cartItem.unit_price || 0) * (cartItem.quantity || 1)).toFixed(2)}</div>
          </div>
          ${shippingDetails}
          ${paymentDetails}
          ${couponDetails}
          <div class="footer">
            <p>This is an automated notification from OptyShop.</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Cart Item Added - ${product.name || 'Product'}`,
    html,
  });
};

/**
 * Send password reset link to user
 */
const sendPasswordResetEmail = async ({ to, firstName, resetUrl }) => {
  const name = firstName || 'there';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #172554; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 24px; margin-top: 20px; }
        .button {
          display: inline-block;
          background-color: #172554;
          color: #ffffff !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset your password</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your OptiShop account password. Click the button below to choose a new password. This link expires in 1 hour.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset password</a>
          </p>
          <p>If you did not request this, you can ignore this email. Your password will not change.</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">Or copy this link: ${resetUrl}</p>
          <div class="footer">
            <p>OptiShop</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Reset your OptiShop password',
    html,
  });
};

module.exports = {
  sendEmail,
  sendCartNotificationToAdmin,
  sendPasswordResetEmail,
};
