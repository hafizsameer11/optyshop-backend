// Prisma Models Export
// This file exports Prisma client for backward compatibility
// All controllers should use: const prisma = require('../lib/prisma');

const prisma = require('../lib/prisma');

// Export Prisma client
module.exports = prisma;

// For backward compatibility, also export as models
// But controllers should migrate to: const prisma = require('../lib/prisma');
module.exports.prisma = prisma;
