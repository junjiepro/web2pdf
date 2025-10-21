# Use Node.js 20 slim base
FROM node:20-bookworm-slim AS base

# Common utilities
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    dumb-init \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Builder stage: install all deps, compile TypeScript, install browsers
FROM base AS builder

COPY package*.json ./
# Install dependencies (dev included) for building
RUN npm install

# Copy sources
COPY tsconfig.json ./
COPY src ./src

# Install Playwright chromium and required system deps in this layer
RUN npx playwright install --with-deps chromium

# Build the project
RUN npm run build

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Install system dependencies required by Playwright in runtime
RUN npx playwright install-deps chromium

# Copy compiled app and Playwright browsers from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /ms-playwright /ms-playwright

# Use non-root user
RUN chown -R node:node /app /ms-playwright
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:${PORT:-3000}/health || exit 1

CMD ["dumb-init", "node", "dist/index.js"]
