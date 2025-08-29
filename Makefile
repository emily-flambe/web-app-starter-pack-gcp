.PHONY: help install dev test build deploy clean setup db-sync

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup    - Initial project setup"
	@echo "  make install  - Install dependencies"
	@echo "  make dev      - Start development servers"
	@echo "  make test     - Run all tests"
	@echo "  make build    - Build for production"
	@echo "  make deploy   - Deploy to production"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make db-sync  - Sync remote database to local db"

# Initial setup
setup:
	@echo "Starting interactive setup..."
	@./setup.sh

# Install dependencies
install:
	npm ci
	npx playwright install

# Development
dev:
	@./scripts/dev.sh

# Testing
test:
	@if [ ! -d "node_modules" ] || [ ! -d "node_modules/msw" ]; then \
		echo "Dependencies missing. Running 'make install'..."; \
		$(MAKE) install; \
	fi
	npm run type-check
	npm run lint
	npm run test
	npm run test:e2e

# Building
build:
	npm run build

# Deployment
deploy:
	@echo "Building and deploying to Cloudflare Workers..."
	npm run build:prod
	npx wrangler deploy
	@echo "✅ Deployment complete!"

# Database sync
db-sync:
	@./scripts/db-sync.sh

# Cleanup
clean:
	rm -rf dist node_modules/.vite coverage playwright-report test-results .turbo
	find . -name "*.log" -delete