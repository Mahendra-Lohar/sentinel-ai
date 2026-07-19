FROM node:24-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install dependencies first for Docker layer caching
COPY package*.json ./
# Use npm ci for clean install, omitting devDependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Explicitly expose the backend port
EXPOSE 8080

# Run the app
CMD ["node", "src/server.js"]
