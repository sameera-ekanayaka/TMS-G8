# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# vite bakes env vars in at build time, so the URLs have to come in as build
# args here, otherwise the build falls back to localhost
ARG VITE_API_URL=http://localhost:5000
ARG VITE_WS_URL=http://localhost:5000
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
