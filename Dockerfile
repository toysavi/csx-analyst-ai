# Multi-stage Multi-Arch Dockerfile for CSX AI Analyst
# Compiles on the host native architecture ($BUILDPLATFORM) with zero QEMU emulation overhead
# Produces fast, lightweight images for both linux/amd64 and linux/arm64

# Stage 1: Build on host native platform ($BUILDPLATFORM) - Blazing fast, zero QEMU emulation
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies natively on the host runner (fast, no QEMU, no illegal instructions)
RUN npm install --legacy-peer-deps

# Copy source code and build frontend bundle + backend server
COPY . .
RUN npm run build

# Remove development dependencies natively on builder
RUN npm prune --production

# Stage 2: Target runtime image (supports linux/amd64 and linux/arm64)
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy pre-built pure-JS assets directly from the native builder
# Pure JavaScript runs identically on both amd64 and arm64 architectures
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose application port
EXPOSE 3000

# Start server with native Node.js (instant startup, zero compilation overhead)
CMD ["node", "dist/server.js"]
