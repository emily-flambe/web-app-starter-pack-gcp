# Web App Starter Pack

Production-ready monorepo starter with React, Cloudflare Workers, and D1 database. Battle-tested stack without the setup overhead.

## Quick Start

```bash
# Automated setup (recommended)
make setup

# Start development
make dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8787

The starter includes a **working Todo app** demonstrating full-stack TypeScript with API calls, CRUD operations, and database persistence.

**New to the template?** See the [step-by-step setup guide](.project/docs/explainers/setup-steps.md) for detailed instructions.

### Pro Tip: Claude Code Alias

Create an alias to ensure Claude always reads the project guidelines:

```bash
alias claudia='claude "Start by running ls -la and then read and understand the steering and documentation in the .project/ directory. Pay EXTRA CAREFUL attention to any files guiding AI behavior. Never say '\''you'\''re absolutely right'\'' ever!!! ALWAYS follow ALL guidelines and standards defined in these files throughout our conversation."'
```

Then use `claudia` instead of `claude` when working on this project.

## Prerequisites

- **Node.js 20.11.0** via nvm (`.nvmrc` included)
- **Cloudflare account** ([free signup](https://dash.cloudflare.com/sign-up))

## Cloudflare Deployment

You'll need a Cloudflare account (free tier works). The `make setup` command handles all configuration interactively (authentication, database creation, schema initialization).

For production deployment after setup:
```bash
make deploy
```

## Make Commands

```bash
make help     # Show all available commands
make setup    # Initial project setup
make install  # Install dependencies
make dev      # Start development servers
make test     # Run all tests
make build    # Build for production
make deploy   # Deploy to production
make clean    # Clean build artifacts
make db-sync  # Sync remote database to local
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono framework
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Testing**: Jest (unit), Playwright (E2E)
- **CI/CD**: GitHub Actions

## Documentation

Detailed documentation is available in the `.project/` directory:

- **[Core Guidelines](./project/guidelines/core/)**: Architecture, development workflow, coding standards
- **[Language Standards](./project/guidelines/languages/)**: TypeScript, React, Python best practices
- **[Development Guides](./project/guidelines/development/)**: Local setup, deployment, troubleshooting
- **[Testing Strategies](./project/guidelines/testing/)**: TDD approach, testing patterns

### Key Documentation

- **Architecture**: `.project/guidelines/core/architecture.md`
- **Development Workflow**: `.project/guidelines/core/development-workflow.md`
- **Deployment Guide**: `.project/guidelines/development/deployment-strategy.md`
- **Troubleshooting**: `.project/guidelines/development/troubleshooting.md`
- **React Standards**: `.project/guidelines/languages/react-standards.md`
- **TypeScript Standards**: `.project/guidelines/languages/typescript-standards.md`

## CI/CD Pipeline

### GitHub Actions Required Secrets
```
CLOUDFLARE_API_TOKEN    # Your Cloudflare API token
CLOUDFLARE_ACCOUNT_ID   # Your Cloudflare account ID
```

Set these in your GitHub repository: Settings → Secrets → Actions

## License

MIT License - see [LICENSE](LICENSE) file for details.