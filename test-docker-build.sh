#!/bin/bash

echo "🐳 Testing Docker build and Prisma generation..."

# Build the Docker image
echo "Building Docker image..."
docker build -t optyshop-backend:test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful"
    
    # Test if Prisma Client is generated correctly
    echo "Testing Prisma Client generation in container..."
    docker run --rm optyshop-backend:test npx prisma generate --force
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma Client generation successful"
        echo "🎉 All tests passed! The Docker image should work correctly in production."
    else
        echo "❌ Prisma Client generation failed"
        exit 1
    fi
else
    echo "❌ Docker build failed"
    exit 1
fi
