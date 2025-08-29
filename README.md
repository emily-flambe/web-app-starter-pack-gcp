# Google Cloud Run Hello World App

A simple Hello World application built with FastAPI (Python) backend and React + TypeScript + Vite frontend, deployed to Google Cloud Run.

## Project Structure

```
.
├── backend/           # FastAPI Python backend
│   ├── main.py       # Main API application
│   └── requirements.txt
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   └── package.json
├── Dockerfile        # Multi-stage Docker build
├── Makefile          # Build and deployment automation
├── cloudbuild.yaml   # Google Cloud Build configuration
├── deploy.sh         # Deployment script
└── deploy-simple.sh  # Simple source-based deployment
```

## Prerequisites

- Google Cloud SDK (gcloud) installed
- Docker installed
- Node.js 20+ and npm
- Python 3.11+
- A Google Cloud Project with billing enabled

## Quick Start

### 1. Initial Setup
```bash
# Create your .env file from the template
make init

# Edit .env and set your Google Project ID
# nano .env  # or use your preferred editor
```

### 2. Configure .env
Copy `.env.example` to `.env` and set your values:
```bash
GOOGLE_PROJECT_ID=your-actual-project-id
GOOGLE_REGION=us-central1  # or your preferred region
SERVICE_NAME=hello-world-app
```

### 3. Deploy
```bash
# With .env configured, simply run:
make deploy

# Or for the fastest deployment (no Docker required):
make quick-deploy
```

## Quick Start with Makefile

### View available commands:
```bash
make help
```

### Build and Deploy:
```bash
# Build Docker image
make build PROJECT_ID=your-project-id

# Deploy to Cloud Run (builds, pushes, and deploys)
make deploy PROJECT_ID=your-project-id

# Or use the quickest method (deploy from source)
make quick-deploy PROJECT_ID=your-project-id
```

## Local Development

### Using Makefile:
```bash
# Install all dependencies
make install

# Run backend (in one terminal)
make dev-backend

# Run frontend (in another terminal)
make dev-frontend
```

### Manual Setup:

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

## Deployment to Google Cloud Run

### Using Makefile (Recommended)

```bash
# Initial setup (enable APIs and configure gcloud)
make setup PROJECT_ID=your-project-id

# Deploy (builds, pushes, and deploys)
make deploy PROJECT_ID=your-project-id

# Or deploy directly from source (faster, no local Docker needed)
make quick-deploy PROJECT_ID=your-project-id
```

### Quick Deploy with Scripts

1. Set your Google Cloud project ID:
```bash
export PROJECT_ID=your-project-id
```

2. Run the deployment script:
```bash
./deploy.sh
```

### Manual Deployment

1. Build the Docker image:
```bash
docker build -t gcr.io/$PROJECT_ID/hello-world-app .
```

2. Push to Container Registry:
```bash
docker push gcr.io/$PROJECT_ID/hello-world-app
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy hello-world-app \
    --image gcr.io/$PROJECT_ID/hello-world-app \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080
```

### Using Cloud Build

Submit the build to Google Cloud Build:
```bash
gcloud builds submit --config cloudbuild.yaml
```

## Environment Variables

The project uses a `.env` file for configuration (ignored by git). Common practices:

| Method | When to Use | Example |
|--------|-------------|---------|
| `.env` file | Local development & deployment | `GOOGLE_PROJECT_ID=my-project` |
| `.env.example` | Template committed to repo | Shows required variables |
| Environment vars | CI/CD pipelines | Set in GitHub Actions/Cloud Build |
| Command line | One-off deployments | `make deploy PROJECT_ID=my-project` |

### Variables

- `GOOGLE_PROJECT_ID`: Your Google Cloud project ID
- `GOOGLE_REGION`: Deployment region (default: us-central1)
- `SERVICE_NAME`: Cloud Run service name (default: hello-world-app)

## API Endpoints

- `GET /`: Root endpoint (returns API info when accessed directly)
- `GET /api/hello`: Hello World message endpoint
- `GET /api/health`: Health check endpoint

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React 18 + TypeScript + Vite
- **Deployment**: Google Cloud Run
- **Container**: Docker with multi-stage build

## Notes

- The frontend is built and served statically by the FastAPI backend in production
- CORS is configured for development (localhost:5173 → localhost:8000)
- The application runs on port 8080 in Cloud Run (configured via PORT environment variable)
- Memory is set to 512Mi which is sufficient for this simple app

## Important Notes for 2025

- **Container Registry is deprecated as of March 2025** - This project uses Artifact Registry
- **Artifact Registry** is the recommended service for container storage on Google Cloud
- **Docker Compose support** - Cloud Run now supports `gcloud run compose up` (private preview)

## Troubleshooting

1. **Authentication Issues**: Make sure you're logged in to gcloud:
   ```bash
   gcloud auth login
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

2. **Project Not Set**: Set your default project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **APIs Not Enabled**: Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

4. **Artifact Registry Repository**: Create the repository if it doesn't exist:
   ```bash
   gcloud artifacts repositories create cloud-run-apps \
       --repository-format=docker \
       --location=us-central1 \
       --description="Docker repository for Cloud Run apps"
   ```

4. **Build Fails**: Check that Docker is running and you have sufficient permissions

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make setup` | Initial setup - enable APIs and configure gcloud |
| `make build` | Build Docker image |
| `make deploy` | Build, push, and deploy to Cloud Run |
| `make quick-deploy` | Deploy directly from source (fastest) |
| `make dev-backend` | Run backend in development mode |
| `make dev-frontend` | Run frontend in development mode |
| `make install` | Install all dependencies |
| `make logs` | View Cloud Run service logs |
| `make describe` | Describe the Cloud Run service |
| `make clean` | Clean build artifacts |
| `make delete` | Delete the Cloud Run service |

## Cost Considerations

- Cloud Run has a generous free tier (2 million requests per month)
- You're only charged for actual usage (per request/compute time)
- The 512Mi memory configuration keeps costs minimal