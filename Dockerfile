# Multi-stage Dockerfile for CSX AI Analyst
# Optimized for GitHub Container Registry (ghcr.io) and Cloud Run

# Stage 1: Build the React frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies reliably with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code and build frontend bundle
COPY . .
RUN npm run build

# Stage 2: Production runtime image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built frontend artifacts and backend server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# Expose application port
EXPOSE 3000

# Start full-stack server
CMD ["npm", "start"]
