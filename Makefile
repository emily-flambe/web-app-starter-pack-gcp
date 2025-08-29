# Makefile for Google Cloud Run Hello World App

# Load environment variables from .env file if it exists
-include .env
export

# Configuration (can be overridden by .env or command line)
PROJECT_ID ?= $(or $(GCP_PROJECT_ID),your-project-id)
REGION ?= $(or $(GCP_REGION),us-central1)
SERVICE_NAME ?= $(or $(GCP_SERVICE_NAME),hello-world-app)
# Use Artifact Registry instead of Container Registry (deprecated March 2025)
ARTIFACT_REGISTRY_LOCATION ?= us-central1
ARTIFACT_REGISTRY_REPO ?= cloud-run-apps
IMAGE_NAME = $(ARTIFACT_REGISTRY_LOCATION)-docker.pkg.dev/$(PROJECT_ID)/$(ARTIFACT_REGISTRY_REPO)/$(SERVICE_NAME)
PORT = 8080

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(GREEN)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.PHONY: check-project
check-project: ## Check if PROJECT_ID is set
	@if [ "$(PROJECT_ID)" = "your-project-id" ]; then \
		echo "$(RED)Error: PROJECT_ID not set$(NC)"; \
		echo "Please either:"; \
		echo "  1. Copy .env.example to .env and set GCP_PROJECT_ID"; \
		echo "  2. Or run: make deploy PROJECT_ID=your-actual-project-id"; \
		exit 1; \
	fi

.PHONY: init
init: ## Initialize project - interactively create .env file
	@if [ -f .env ]; then \
		echo "$(YELLOW).env file already exists$(NC)"; \
		read -p "Do you want to overwrite it? (y/N): " -n 1 -r; \
		echo; \
		if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
			echo "$(GREEN)Keeping existing .env file$(NC)"; \
			exit 0; \
		fi; \
	fi; \
	echo "$(GREEN)Setting up environment configuration...$(NC)"; \
	echo "$(YELLOW)Please provide values for your environment variables:$(NC)"; \
	echo ""; \
	read -p "Google Cloud Project ID: " project_id; \
	read -p "Google Cloud Region [us-central1]: " region; \
	region=$${region:-us-central1}; \
	read -p "Service Name [hello-world-app]: " service_name; \
	service_name=$${service_name:-hello-world-app}; \
	read -p "Artifact Registry Location [us-central1]: " ar_location; \
	ar_location=$${ar_location:-us-central1}; \
	read -p "Artifact Registry Repository [cloud-run-apps]: " ar_repo; \
	ar_repo=$${ar_repo:-cloud-run-apps}; \
	read -p "Backend Port [8000]: " backend_port; \
	backend_port=$${backend_port:-8000}; \
	read -p "Frontend Port [5173]: " frontend_port; \
	frontend_port=$${frontend_port:-5173}; \
	echo ""; \
	echo "$(GREEN)Creating .env file...$(NC)"; \
	echo "# Google Cloud Configuration" > .env; \
	echo "GCP_PROJECT_ID=$$project_id" >> .env; \
	echo "GCP_REGION=$$region" >> .env; \
	echo "GCP_SERVICE_NAME=$$service_name" >> .env; \
	echo "" >> .env; \
	echo "# Artifact Registry Configuration" >> .env; \
	echo "ARTIFACT_REGISTRY_LOCATION=$$ar_location" >> .env; \
	echo "ARTIFACT_REGISTRY_REPO=$$ar_repo" >> .env; \
	echo "" >> .env; \
	echo "# Local Development Ports (optional)" >> .env; \
	echo "BACKEND_PORT=$$backend_port" >> .env; \
	echo "FRONTEND_PORT=$$frontend_port" >> .env; \
	echo ""; \
	echo "$(GREEN)✓ .env file created successfully!$(NC)"; \
	echo "$(YELLOW)Configuration summary:$(NC)"; \
	echo "  Project ID: $$project_id"; \
	echo "  Region: $$region"; \
	echo "  Service Name: $$service_name"; \
	echo "  Artifact Registry Location: $$ar_location"; \
	echo "  Artifact Registry Repo: $$ar_repo"; \
	echo "  Backend Port: $$backend_port"; \
	echo "  Frontend Port: $$frontend_port"

.PHONY: install
install: ## Install dependencies for local development
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd backend && pip install -r requirements.txt
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd frontend && npm install

.PHONY: dev-backend
dev-backend: ## Run backend in development mode
	@echo "$(GREEN)Starting FastAPI backend...$(NC)"
	cd backend && uvicorn main:app --reload --port 8000

.PHONY: dev-frontend
dev-frontend: ## Run frontend in development mode
	@echo "$(GREEN)Starting React frontend...$(NC)"
	cd frontend && npm run dev

.PHONY: dev
dev: ## Run both frontend and backend in development (requires 2 terminals)
	@echo "$(YELLOW)Starting development servers...$(NC)"
	@echo "$(YELLOW)Run 'make dev-backend' in one terminal$(NC)"
	@echo "$(YELLOW)Run 'make dev-frontend' in another terminal$(NC)"

.PHONY: build-frontend
build-frontend: ## Build frontend for production
	@echo "$(GREEN)Building frontend...$(NC)"
	cd frontend && npm run build

.PHONY: build
build: check-project ## Build Docker image
	@echo "$(GREEN)Building Docker image: $(IMAGE_NAME)...$(NC)"
	docker build --platform linux/amd64 -t $(IMAGE_NAME) .
	@echo "$(GREEN)Build complete!$(NC)"

.PHONY: push
push: check-project ## Push Docker image to Container Registry
	@echo "$(GREEN)Pushing image to Container Registry...$(NC)"
	docker push $(IMAGE_NAME)
	@echo "$(GREEN)Push complete!$(NC)"

.PHONY: deploy
deploy: check-project build push ## Build, push, and deploy to Cloud Run
	@echo "$(GREEN)Deploying to Cloud Run...$(NC)"
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--port $(PORT) \
		--memory 512Mi \
		--project $(PROJECT_ID)
	@echo "$(GREEN)Deployment complete!$(NC)"
	@echo "$(GREEN)Getting service URL...$(NC)"
	@gcloud run services describe $(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--format 'value(status.url)'

.PHONY: deploy-source
deploy-source: check-project ## Deploy directly from source (Cloud Run builds the container)
	@echo "$(GREEN)Deploying from source to Cloud Run...$(NC)"
	gcloud run deploy $(SERVICE_NAME) \
		--source . \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--allow-unauthenticated \
		--port $(PORT) \
		--memory 512Mi
	@echo "$(GREEN)Deployment complete!$(NC)"

.PHONY: quick-deploy
quick-deploy: deploy-source ## Alias for deploy-source (quickest deployment method)

.PHONY: enable-apis
enable-apis: check-project ## Enable required Google Cloud APIs
	@echo "$(GREEN)Enabling required APIs...$(NC)"
	gcloud services enable cloudbuild.googleapis.com --project $(PROJECT_ID)
	gcloud services enable run.googleapis.com --project $(PROJECT_ID)
	gcloud services enable artifactregistry.googleapis.com --project $(PROJECT_ID)
	@echo "$(GREEN)APIs enabled!$(NC)"

.PHONY: create-artifact-repo
create-artifact-repo: check-project ## Create Artifact Registry repository if it doesn't exist
	@echo "$(GREEN)Creating Artifact Registry repository...$(NC)"
	@gcloud artifacts repositories describe $(ARTIFACT_REGISTRY_REPO) \
		--location=$(ARTIFACT_REGISTRY_LOCATION) \
		--project=$(PROJECT_ID) >/dev/null 2>&1 || \
	gcloud artifacts repositories create $(ARTIFACT_REGISTRY_REPO) \
		--repository-format=docker \
		--location=$(ARTIFACT_REGISTRY_LOCATION) \
		--description="Docker repository for Cloud Run apps" \
		--project=$(PROJECT_ID)
	@echo "$(GREEN)Repository ready!$(NC)"

.PHONY: setup
setup: check-project enable-apis create-artifact-repo ## Initial setup - enable APIs, create repo, and configure gcloud
	@echo "$(GREEN)Setting up Google Cloud project...$(NC)"
	gcloud config set project $(PROJECT_ID)
	gcloud auth configure-docker $(ARTIFACT_REGISTRY_LOCATION)-docker.pkg.dev
	@echo "$(GREEN)Setup complete!$(NC)"

.PHONY: logs
logs: check-project ## View Cloud Run service logs
	@echo "$(GREEN)Fetching logs for $(SERVICE_NAME)...$(NC)"
	gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$(SERVICE_NAME)" \
		--limit 50 \
		--project $(PROJECT_ID) \
		--format "table(timestamp, textPayload)"

.PHONY: describe
describe: check-project ## Describe the Cloud Run service
	gcloud run services describe $(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID)

.PHONY: delete
delete: check-project ## Delete the Cloud Run service
	@echo "$(YELLOW)Warning: This will delete the service $(SERVICE_NAME)$(NC)"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read confirm
	gcloud run services delete $(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--quiet
	@echo "$(GREEN)Service deleted!$(NC)"

.PHONY: test-local
test-local: ## Test the local Docker build
	@echo "$(GREEN)Building and running Docker container locally...$(NC)"
	docker build --platform linux/amd64 -t $(SERVICE_NAME)-local .
	docker run -p $(PORT):$(PORT) -e PORT=$(PORT) $(SERVICE_NAME)-local

.PHONY: clean
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/__pycache__
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	@echo "$(GREEN)Clean complete!$(NC)"

.PHONY: lint
lint: ## Run linters
	@echo "$(GREEN)Running frontend linter...$(NC)"
	cd frontend && npm run lint || true
	@echo "$(GREEN)Running backend linter (if configured)...$(NC)"
	@which flake8 > /dev/null && cd backend && flake8 . || echo "$(YELLOW)flake8 not installed, skipping Python linting$(NC)"

.PHONY: format
format: ## Format code
	@echo "$(GREEN)Formatting frontend code...$(NC)"
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}" || true
	@echo "$(GREEN)Formatting backend code...$(NC)"
	@which black > /dev/null && black backend/ || echo "$(YELLOW)black not installed, skipping Python formatting$(NC)"

# Default target
.DEFAULT_GOAL := help