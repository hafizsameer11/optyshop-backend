# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for Prisma CLI)
RUN npm install && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install production dependencies AND Prisma CLI
RUN npm install --only=production && npm cache clean --force
RUN npm install prisma@6.19.0 --no-save && npm cache clean --force

# Copy Prisma schema and generated client from builder
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy application code and emergency fixes
COPY --chown=nodejs:nodejs . .

# Create uploads directory with proper permissions (before switching user)
RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/uploads && \
    chmod -R 755 /app/uploads

# Declare volume for uploads persistence (must be configured in Dokploy)
# This directory should be mounted as a volume to persist files across container rebuilds
VOLUME ["/app/uploads"]

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Copy start script and make executable
COPY --chown=nodejs:nodejs scripts/start-with-migrations.sh /app/start.sh
RUN chmod +x /app/start.sh

# Alternative CMD (fallback if start.sh has issues):
# CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migrations skipped' && npx prisma generate --force && node server.js"]

# Start script: run migrations then start server
# Migrations will fail gracefully if already applied
CMD ["/app/start.sh"]
