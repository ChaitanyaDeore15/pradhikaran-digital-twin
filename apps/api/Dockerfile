# Multi-stage production build for Pradhikaran Digital Twin API
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace and API package definitions
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY services/ingestion/package.json ./services/ingestion/

# Install dependencies across monorepo
RUN npm ci

# Copy API source code and data assets
COPY apps/api ./apps/api
COPY data ./data

# Build TypeScript to JavaScript
WORKDIR /app/apps/api
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY services/ingestion/package.json ./services/ingestion/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY data ./data

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/server.js"]
