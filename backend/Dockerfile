FROM node:20-slim

# Node 20 exposes the Web Crypto API (globalThis.crypto) as a global, which the
# @azure/communication-email SDK requires to sign requests. Node 18 did not,
# causing onboarding emails to fail with "crypto is not defined".

# Install required system libs for Prisma engine (OpenSSL on Debian slim)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Security: run as non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npx prisma generate

# Switch to non-root
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the Node.js server directly
CMD ["node", "server.js"]