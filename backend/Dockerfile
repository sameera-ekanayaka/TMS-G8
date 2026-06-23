FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
# Apply any pending migrations to the database before starting the server.
# `migrate deploy` is safe to run repeatedly and only applies new migrations.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]