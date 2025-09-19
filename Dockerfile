# Simple production-ready Dockerfile for cloud deployment
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove source files (keep only dist)
RUN rm -rf src test *.md *.json !package.json !package-lock.json

# Create a polyfill file for crypto
RUN echo "global.crypto = require('crypto');" > /app/crypto-polyfill.js

# Set default environment variables for Cloud Run
ENV PORT=8080

# Expose port (Cloud Run will override this)
EXPOSE $PORT

# Start the application with crypto polyfill
CMD ["node", "-r", "/app/crypto-polyfill.js", "dist/main"]
