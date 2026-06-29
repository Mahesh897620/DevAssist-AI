#!/usr/bin/env bash
# exit on error
set -o errexit

# Clean node_modules during CI/CD to prevent cache mismatch issues
if [ -d "frontend/node_modules" ]; then
  echo "Cleaning old node_modules..."
  rm -rf frontend/node_modules
fi

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build backend
echo "Installing backend dependencies..."
if command -v pip3 &> /dev/null; then
  pip3 install -r Backend/requirements.txt
else
  pip install -r Backend/requirements.txt
fi
