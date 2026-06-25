# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Production URLs are hardcoded as ARG defaults so Vite always bakes in the
# correct value even if CI/CD build-args fail to inject.
# CI/CD can still override these via --build-arg but they will always fall back
# to the correct production values.
ARG VITE_API_URL=https://tms-backend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io
ARG VITE_WS_URL=https://tms-backend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
