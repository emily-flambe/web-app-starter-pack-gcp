# CI/CD Setup Guide

## Overview

This project uses an optimized CI/CD pipeline with:
- **Parallel execution** of deployment and testing after build
- **Preview deployments** for pull requests with immediate availability
- **Automatic PR comments** with deployment URLs
- **Chromium E2E testing** (simplified for speed)
- **Final status check** that blocks PR merge on any failure

## Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

### Cloudflare Secrets (Required for Preview Deployments)
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: `Account:Cloudflare Workers Scripts:Edit`
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
  - Find in: Cloudflare Dashboard → Right sidebar

### Optional Secrets
- `CODECOV_TOKEN`: For coverage reporting (get from codecov.io)

## Pipeline Stages

### 1. Build
- Production build verification
- Creates artifacts for all subsequent steps

### 2. Parallel Execution
After build completes, ALL of these run simultaneously:
- **Lint & Format**: ESLint and Prettier checks
- **Type Check**: TypeScript compilation
- **Unit Tests**: Vitest testing
- **E2E Tests**: Chromium-only testing
- **Deploy**: Preview deployment to Cloudflare Workers

### 3. Final Status Check
- Runs after all jobs complete
- Fails if ANY job failed
- Blocks PR merge on failure

## Preview Deployments

Pull requests automatically get:
- A unique preview URL: `https://[version-id]-web-app-starter-pack.[username].workers.dev`
- Immediate deployment without waiting for tests
- Automatic updates on new commits
- Comment with deployment URL
- Connection to the production D1 database

## Local Testing

Before pushing, run locally:
```bash
npm run lint        # Check linting
npm run type-check  # TypeScript check
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run build      # Build check
```

## Workflow Features

### Concurrency Control
- Cancels in-progress runs when new commits are pushed
- Saves CI minutes and provides faster feedback

### Testing Strategy
- E2E tests run on Chromium only (simplified for speed)
- Tests generate reports as artifacts

### Optimized Pipeline Order
- Build runs first to create artifacts
- ALL validation and deployment run in parallel after build
- Final status check ensures all jobs succeed before merge

## Customization

### Adjust Test Browsers
Edit the matrix in `.github/workflows/ci-cd.yml`:
```yaml
matrix:
  browser: [chromium, firefox, webkit, edge]
```

### Change Preview URL Pattern
Edit the deployment URL in the workflow:
```yaml
environment-url: https://pr-${{ github.event.pull_request.number }}-yourapp.workers.dev
```

### Add More Environments
Add to `wrangler.toml`:
```toml
[env.your-env]
name = "app-your-env"
vars = { NODE_ENV = "your-env" }
```

## Troubleshooting

### Preview Deployment Fails
1. Check Cloudflare API token permissions
2. Verify account ID is correct
3. Ensure wrangler.toml has preview environment

### E2E Tests Fail
1. Check if app builds correctly
2. Verify Playwright browsers are installed
3. Review test reports in GitHub artifacts

### Coverage Not Showing
1. Ensure CODECOV_TOKEN is set (optional but recommended)
2. Check that tests generate lcov.info file
3. Verify coverage command runs correctly