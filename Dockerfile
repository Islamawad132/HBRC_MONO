# ================================
# HBRC Monorepo - Unified Dockerfile
# ================================
# This Dockerfile builds both API and Frontend
# Use --target to specify which service to build

# ================================
# Stage 1: Base Dependencies
# ================================
FROM node:22-alpine AS base
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# ================================
# Stage 2: API Dependencies
# ================================
FROM base AS api-deps
WORKDIR /app

# Copy API package files
COPY apps/api/package*.json ./apps/api/

# Install API dependencies
RUN npm ci --workspace=api --legacy-peer-deps

# ================================
# Stage 3: API Builder
# ================================
FROM node:22-alpine AS api-builder
WORKDIR /app

# Copy dependencies
COPY --from=api-deps /app/node_modules ./node_modules
COPY --from=api-deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY . .

# Generate Prisma Client and build API
WORKDIR /app/apps/api
RUN npx prisma generate && npm run build

# ================================
# Stage 4: API Runner
# ================================
FROM node:22-alpine AS api
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init openssl wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Create uploads directory
RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads

# Copy built API and dependencies
COPY --from=api-builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/node_modules ./api_node_modules
COPY --from=api-builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
COPY --chown=nestjs:nodejs apps/api/package*.json ./

# Setup NODE_PATH
ENV NODE_PATH=/app/node_modules:/app/api_node_modules

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start API
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main"]

# ================================
# Stage 5: Web Dependencies
# ================================
FROM base AS web-deps
WORKDIR /app

# Copy web package files
COPY apps/web/package*.json ./apps/web/

# Install web dependencies
RUN npm ci --workspace=web --legacy-peer-deps

# ================================
# Stage 6: Web Builder
# ================================
FROM node:22-alpine AS web-builder
WORKDIR /app

# Build argument for API URL (must be set at build time for Vite)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Copy dependencies
COPY --from=web-deps /app/node_modules ./node_modules
COPY --from=web-deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY . .

# Build frontend with API URL
WORKDIR /app/apps/web
RUN npm run build

# ================================
# Stage 7: Web Runner (Nginx)
# ================================
FROM nginx:alpine AS web
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built frontend files
COPY --from=web-builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
