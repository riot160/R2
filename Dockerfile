# ═══════════════════════════════════════════════════
#  RIOT MD  ·  Dockerfile  ·  Node.js 20 Alpine
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 py3-pip ffmpeg curl \
    && pip3 install yt-dlp --break-system-packages \
    && apk del py3-pip

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source
COPY . .

# Create required directories
RUN mkdir -p sessions database

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/status || exit 1

# Start bot
CMD ["node", "index.js"]
