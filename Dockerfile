# 1. Stage: Builder
FROM node:18-alpine AS builder

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
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apk -U add openssl

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy prisma directory (required for migrations usually, or if schema is needed at runtime)
# Not strictly required for running the generated client, but good practice if we run migrations in entrypoint.
COPY --from=builder /app/prisma ./prisma

# Expose port (default NestJS port)
EXPOSE 3000

# Start command
CMD ["node", "dist/main"]
