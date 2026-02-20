# 1. Stage: Builder
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install app dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Prune dev dependencies to keep image small
RUN npm prune --production

# 2. Stage: Production
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apk -U add openssl

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy prisma directory (required for migrations at runtime)
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
