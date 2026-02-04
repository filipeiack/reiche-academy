# Multi-stage Dockerfile for NestJS Backend

# Build arguments for versioning
ARG BUILD_VERSION=dev
ARG BUILD_DATE=unknown
ARG GIT_COMMIT=unknown
ARG ENVIRONMENT=development

# Base stage - common dependencies
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM base AS production

# Re-declare build arguments (needed in each stage)
ARG BUILD_VERSION=dev
ARG BUILD_DATE=unknown
ARG GIT_COMMIT=unknown
ARG ENVIRONMENT=production

# Set NODE_ENV
ENV NODE_ENV=production

# Add version metadata as environment variables
ENV BUILD_VERSION=$BUILD_VERSION \
    BUILD_DATE=$BUILD_DATE \
    GIT_COMMIT=$GIT_COMMIT \
    DEPLOY_ENVIRONMENT=$ENVIRONMENT

# Labels for metadata
LABEL org.opencontainers.image.title="Reiche Academy Backend"
LABEL org.opencontainers.image.version="$BUILD_VERSION"
LABEL org.opencontainers.image.created="$BUILD_DATE"
LABEL org.opencontainers.image.revision="$GIT_COMMIT"
LABEL org.opencontainers.image.environment="$ENVIRONMENT"

# Install tsx globally for running TypeScript scripts (seed, etc)
RUN npm install -g tsx

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy source files so TypeScript seeds can run with `tsx prisma/seed.ts`
COPY --from=builder /app/src ./src

# Generate Prisma Client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
