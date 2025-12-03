const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Generate secure random secrets
const jwtSecret = crypto.randomBytes(32).toString('base64');
const jwtRefreshSecret = crypto.randomBytes(32).toString('base64');

// .env file content
const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
# Prisma uses DATABASE_URL - format: mysql://user:password@host:port/database
# Update with your MySQL credentials
DATABASE_URL=mysql://root:@localhost:3306/optyshop
# Legacy DB config (optional, for reference)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=optyshop
DB_USER=root
DB_PASSWORD=

# JWT Configuration
# Generated secure secrets - Keep these safe!
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_REFRESH_EXPIRE=30d

# AWS S3 Configuration (for file uploads)
# Optional: Leave empty if not using file uploads
# Get these from AWS IAM Console: https://console.aws.amazon.com/iam/
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=optyshop-uploads

# Email Configuration (Optional - for notifications)
# Leave empty if not using email features
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@optyshop.com

# Payment Gateway Configuration (Optional)
# Leave empty if not using payment gateways
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

// Write .env file
const envPath = path.join(__dirname, '.env');

try {
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('   If you want to regenerate it, delete the existing .env file first.');
    process.exit(1);
  }

  // Write the .env file
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('✅ .env file created successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Update DATABASE_URL with your MySQL password (format: mysql://user:password@host:port/database)');
  console.log('   2. (Optional) Add AWS S3 credentials if using file uploads');
  console.log('   3. (Optional) Add email credentials if using email features');
  console.log('   4. (Optional) Add payment gateway keys if using payments');
  console.log('');
  console.log('🔐 Secure JWT secrets have been generated automatically.');
  console.log('   Keep these secrets safe and never commit them to version control!');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

