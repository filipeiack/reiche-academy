# Multi-stage Dockerfile for Angular Frontend

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

# Copy custom nginx config (optional - usar nginx padrão se não tiver custom)
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist/reiche-academy/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
