# GitHub Actions CI/CD Setup

## Overview

This repository uses GitHub Actions for continuous integration and deployment to Google Cloud Run.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)
- **Triggers**: Push to `main` branch or Pull Requests to `main`
- **Actions**:
  - On all events: Run tests, linting, type checking, and build validation
  - On push to `main` only: Deploy to production Cloud Run service

### 2. PR Preview Environment (`pr-preview.yml`)
- **Triggers**: Pull Request opened, synchronized, or reopened
- **Actions**:
  - Creates a temporary preview environment for each PR
  - Comments on the PR with the preview URL
  - Automatically cleans up when PR is closed

## Setup Instructions

### 1. Create a Google Cloud Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="GitHub Actions CI/CD" \
  --display-name="GitHub Actions"

# Get the service account email
export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=${SA_EMAIL}
```

### 2. Add GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

1. **GCP_PROJECT_ID**: Your Google Cloud project ID (e.g., `hello-world-app-470503`)
2. **GCP_SA_KEY**: The entire contents of `github-actions-key.json`

```bash
# Copy the contents of this file to GCP_SA_KEY secret
cat github-actions-key.json
```

**Important**: Delete the local key file after adding to GitHub:
```bash
rm github-actions-key.json
```

### 3. (Optional) Use Workload Identity Federation

For enhanced security, use Workload Identity Federation instead of service account keys:

```bash
# Enable required APIs
gcloud services enable iamcredentials.googleapis.com

# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"

# Grant permissions to the repository
export REPO="your-github-username/web-app-starter-pack-gcp"
export WIF_SERVICE_ACCOUNT="${SA_EMAIL}"

gcloud iam service-accounts add-iam-policy-binding ${WIF_SERVICE_ACCOUNT} \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}" \
  --role="roles/iam.workloadIdentityUser"
```

Then update the workflow to use WIF instead of service account key.

## Build Strategy

### When Builds Happen

1. **Pull Requests**: 
   - Tests and build validation run on every push
   - Optional: Preview deployments for testing

2. **Main Branch**:
   - Full CI/CD pipeline runs
   - Docker image is built and pushed to Artifact Registry
   - Cloud Run service is updated with new image

### Why Rebuild?

Cloud Run best practices:
- **Immutable deployments**: Each deployment is a specific container image
- **Version tracking**: Each commit gets its own image tag
- **Rollback capability**: Previous versions remain in Artifact Registry
- **Security**: Latest dependencies and patches in each build

### Build Optimization

The workflows include several optimizations:
- **Docker layer caching**: Uses `--cache-from` to reuse unchanged layers
- **Dependency caching**: Node and Python dependencies are cached
- **Selective deployment**: Only deploys on main branch, not PRs
- **Platform-specific builds**: Ensures linux/amd64 for Cloud Run compatibility

## Cost Considerations

### GitHub Actions
- **Public repos**: Free unlimited minutes
- **Private repos**: 2,000 free minutes/month, then $0.008/minute

### Google Cloud Run
- **Free tier**: 2 million requests/month, 360,000 GB-seconds/month
- **PR Previews**: Set max-instances=2 to limit costs
- **Auto-cleanup**: PR previews are deleted when PR closes

## Monitoring

View deployment status:
- GitHub Actions tab in your repository
- Cloud Run console: https://console.cloud.google.com/run
- Service logs: `gcloud logging read "resource.type=cloud_run_revision"`

## Rollback

If a deployment fails:

```bash
# List revisions
gcloud run revisions list --service=hello-world-app --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic hello-world-app \
  --to-revisions=hello-world-app-00003=100 \
  --region=us-central1
```

## Security Notes

- Never commit service account keys to the repository
- Use Workload Identity Federation for production
- Regularly rotate service account keys if using them
- Review and limit IAM permissions to minimum required
- Consider using separate projects for staging/production