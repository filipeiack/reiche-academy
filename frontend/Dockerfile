# Multi-stage Dockerfile for Angular Frontend

# Build arguments for versioning
ARG BUILD_VERSION=dev
ARG BUILD_DATE=unknown
ARG GIT_COMMIT=unknown
ARG ENVIRONMENT=development

# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start development server with host binding
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll=2000"]

# Build stage
FROM base AS builder

# Build configuration (production | staging)
ARG BUILD_CONFIGURATION=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build -- --configuration $BUILD_CONFIGURATION

# Production stage with Nginx
FROM nginx:alpine AS production

# Re-declare build arguments
ARG BUILD_VERSION=dev
ARG BUILD_DATE=unknown
ARG GIT_COMMIT=unknown
ARG ENVIRONMENT=production

# Labels for metadata
LABEL org.opencontainers.image.title="Reiche Academy Frontend"
LABEL org.opencontainers.image.version="$BUILD_VERSION"
LABEL org.opencontainers.image.created="$BUILD_DATE"
LABEL org.opencontainers.image.revision="$GIT_COMMIT"
LABEL org.opencontainers.image.environment="$ENVIRONMENT"

# Copy custom nginx config (optional - usar nginx padrão se não tiver custom)
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application (Angular 17+ outputs to browser/ subdirectory)
COPY --from=builder /app/dist/reiche-academy/browser /usr/share/nginx/html

# Create version info file for runtime access
RUN echo "{\"version\":\"$BUILD_VERSION\",\"buildDate\":\"$BUILD_DATE\",\"commit\":\"$GIT_COMMIT\",\"environment\":\"$ENVIRONMENT\"}" > /usr/share/nginx/html/version.json

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
