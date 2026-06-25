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

# The app writes uploaded attachments to /app/uploads. Files copied above are
# owned by root, so the non-root runtime user can't write there — create the
# dir and hand it to appuser, otherwise multer fails with EACCES on every upload.
# NOTE: Container Apps storage is ephemeral; mount an Azure Files volume here for
# uploads that must survive restarts/scaling.
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# Switch to non-root
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the Node.js server directly
CMD ["node", "server.js"]