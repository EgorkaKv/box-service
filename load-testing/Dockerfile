# Dockerfile for load testing - optimized for Cloud Run
FROM grafana/k6:latest

# Switch to root to handle permissions
USER root

# Create app directory
WORKDIR /app

# Copy test file and configuration
COPY load-test.js ./
COPY package.json ./

# Create results directory
RUN mkdir -p results && \
    chown -R 1000:1000 /app

# Switch back to non-root user for security
USER 1000

# Run the load test directly
CMD ["run", "--out", "json=results/load-test.json", "load-test.js"]
