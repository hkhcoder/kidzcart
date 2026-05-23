# =============================================================================
# Stage 1 — Build Angular app
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build for production
COPY . .
RUN npm run build -- --configuration production

# =============================================================================
# Stage 2 — Serve with Nginx
# =============================================================================
FROM nginx:1.27-alpine AS runtime

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app from builder stage
# angular.json outputPath is dist/kids-marketplace-ui
COPY --from=builder /app/dist/kids-marketplace-ui /usr/share/nginx/html

# Copy custom Nginx config (reverse-proxy /api/* to backends)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
