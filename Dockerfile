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

# Copy Prisma schema from builder
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Generate Prisma Client in production stage (before switching user to avoid permission issues)
# This ensures the client matches the actual database schema
RUN npx prisma generate

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create uploads directory with proper permissions (before switching user)
RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/uploads && \
    chmod -R 755 /app/uploads

# Create node_modules/.prisma directory with write permissions for nodejs user
# This allows Prisma Client to be regenerated at runtime
RUN mkdir -p /app/node_modules/.prisma && \
    chown -R nodejs:nodejs /app/node_modules && \
    chmod -R 755 /app/node_modules

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

# Start script: run migrations, regenerate Prisma Client, then start server
# This ensures database schema is up to date before application starts
CMD ["sh", "-c", "sh ./scripts/migrate-and-start.sh && node server.js"]
