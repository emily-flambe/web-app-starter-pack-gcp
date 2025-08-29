#!/bin/bash

# Web App Starter Pack - CI/CD Setup Script
# Automated setup for continuous integration environments

set -e  # Exit on error

echo "Setting up Web App Starter Pack (CI mode)..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Setup environment files
echo "Setting up environment files..."
[ ! -f ".env.local" ] && cp .env.example .env.local || true
[ ! -f ".dev.vars" ] && cp .dev.vars.example .dev.vars || true

# Build frontend
echo "Building frontend..."
npm run build

# Run tests
echo "Running tests..."
npm run type-check
npm run lint
npm run test

echo "CI setup complete!"