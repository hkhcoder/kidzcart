# =============================================================================
# Shared image for all three product-donation-service processes:
#   - API server:          CMD ["node", "src/server.js"]
#   - Coupon worker:       CMD ["node", "src/workers/couponWorker.js"]
#   - Notification worker: CMD ["node", "src/workers/notificationWorker.js"]
#
# The CMD is overridden per-service in docker-compose.yml.
# =============================================================================
FROM node:20-alpine AS runtime

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --prefer-offline

# Copy application source
COPY src ./src

# Default: run the API server (overridden for workers in compose)
EXPOSE 4002

CMD ["node", "src/server.js"]
