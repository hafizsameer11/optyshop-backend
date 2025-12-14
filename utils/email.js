const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Only create transporter if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email not configured. Skipping email send.');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
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
 * @param {Object} data - Cart notification data
 * @param {Object} data.customer - Customer information
 * @param {Object} data.product - Product information
 * @param {Object} data.cartItem - Cart item details
 * @param {Object} data.shippingInfo - Shipping information (optional)
 * @param {Object} data.paymentInfo - Payment information (optional)
 * @param {Object} data.coupon - Coupon information (optional)
 */
const sendCartNotificationToAdmin = async ({ customer, product, cartItem, shippingInfo, paymentInfo, coupon }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
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
            ${cartItem.lens_index ? `<div class="info-item"><strong>Lens Index:</strong> ${cartItem.lens_index}</div>` : ''}
            ${cartItem.lens_coatings ? `<div class="info-item"><strong>Lens Coatings:</strong> ${Array.isArray(cartItem.lens_coatings) ? cartItem.lens_coatings.join(', ') : cartItem.lens_coatings}</div>` : ''}
            ${cartItem.prescription_id ? `<div class="info-item"><strong>Prescription ID:</strong> ${cartItem.prescription_id}</div>` : ''}
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

module.exports = {
  sendEmail,
  sendCartNotificationToAdmin,
};




