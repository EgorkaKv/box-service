# Simple production-ready Dockerfile for cloud deployment
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove source files (keep only dist)
RUN rm -rf src test *.md *.json !package.json !package-lock.json

# Expose port
EXPOSE 3000

# Add simple health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Start the application
CMD ["node", "dist/main"]
