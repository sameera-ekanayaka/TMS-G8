FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
# run any pending migrations before starting the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]