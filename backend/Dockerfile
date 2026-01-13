# Multi-stage Dockerfile for NestJS Backend

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

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

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
