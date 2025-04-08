#!/bin/bash

# Build Docker image without cache
echo "Building Docker image..."
docker build --no-cache -t complimo-fe .

# Run Docker container
echo "Running Docker container..."
docker run -d -p 3000:3000 complimo-fe

# Restart nginx
echo "Restarting nginx..."
sudo systemctl restart nginx

echo "All done ✅"
