# GitHub Configuration

## Required GitHub Secrets for CI/CD

To enable the GitHub Actions CI/CD pipeline, you need to add the following secrets to your repository:

### 1. `GCP_PROJECT_ID`
Your Google Cloud Project ID (e.g., `hello-world-app-470503`)

### 2. `GCP_SA_KEY`
The JSON key for a Google Cloud service account with the following permissions:
- `roles/run.admin` - To deploy and manage Cloud Run services
- `roles/artifactregistry.writer` - To push Docker images to Artifact Registry
- `roles/iam.serviceAccountUser` - To act as the service account

## How to Set Up GitHub Secrets

### Step 1: Create a Service Account

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create the service account
gcloud iam service-accounts create github-actions \
  --description="GitHub Actions CI/CD" \
  --display-name="GitHub Actions" \
  --project=$PROJECT_ID

# Set the service account email
export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Create and download the key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=${SA_EMAIL} \
  --project=$PROJECT_ID
```

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

#### GCP_PROJECT_ID
- **Name**: `GCP_PROJECT_ID`
- **Value**: Your project ID (e.g., `hello-world-app-470503`)

#### GCP_SA_KEY
- **Name**: `GCP_SA_KEY`
- **Value**: The entire contents of `github-actions-key.json`

To get the JSON key contents:
```bash
cat github-actions-key.json
```
Copy the entire JSON output and paste it as the secret value.

### Step 3: Clean Up Local Key File

**Important**: Delete the local key file after adding it to GitHub Secrets:
```bash
rm github-actions-key.json
```

## Testing the CI/CD Pipeline

Once the secrets are configured:

1. **Pull Request**: Opens a PR to trigger the test pipeline
2. **Merge to Main**: Merging will trigger the deployment pipeline

The workflows will:
- Run tests and linting on every PR
- Deploy to Cloud Run when code is merged to main
- Optionally create preview environments for PRs

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the service account has all required roles
2. **Invalid Key**: Make sure you copied the entire JSON key including brackets
3. **Project Not Found**: Verify the project ID matches your GCP project
4. **APIs Not Enabled**: The workflows will try to enable required APIs, but you can do it manually:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com
   ```

### Verifying Service Account Permissions

```bash
# List roles for the service account
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:${SA_EMAIL}"
```

## Security Best Practices

- **Never commit service account keys** to the repository
- **Rotate keys regularly** (every 90 days recommended)
- **Use Workload Identity Federation** for production (more secure than keys)
- **Limit permissions** to only what's necessary
- **Monitor usage** through Cloud Audit Logs