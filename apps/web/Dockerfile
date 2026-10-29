# Multi-stage production build for Pradhikaran Digital Twin Web Client
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace and Web package definitions
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY services/ingestion/package.json ./services/ingestion/

# Install dependencies across monorepo
RUN npm ci

# Copy web client source code
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Build static bundle with CesiumJS
ENV NODE_ENV=production
RUN npm run build

# Production static serving with Nginx
FROM nginx:alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
