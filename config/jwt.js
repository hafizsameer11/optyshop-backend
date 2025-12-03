require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
};

