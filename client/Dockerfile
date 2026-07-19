# Stage 1: Build the React Application
FROM node:24-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# We don't need env vars during build since Vite embeds them, but if we did, we'd pass them as build args
RUN npm run build

# Stage 2: Serve the static files using Nginx
FROM nginx:alpine
# Copy the build output to replace the default nginx contents
COPY --from=builder /app/dist /usr/share/nginx/html
# Add custom Nginx config for single-page app routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
