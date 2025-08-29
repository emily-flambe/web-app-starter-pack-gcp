# Project Guidelines

This directory contains all development guidelines, standards, and best practices for the Web App Starter Pack project.

## Directory Structure

### Core Guidelines
- **[ai-behavior.md](core/ai-behavior.md)** - Critical rules for AI assistants working on this project
- **[project-principles.md](core/project-principles.md)** - Core principles and philosophies

### Development
- **[development-workflow.md](development/development-workflow.md)** - Git workflow, environment setup, and development process
- **[local-development.md](development/local-development.md)** - Local development strategy using native Wrangler
- **[deployment-strategy.md](development/deployment-strategy.md)** - Cloudflare Workers deployment and platform abstraction

### Language Standards
- **[typescript-standards.md](languages/typescript-standards.md)** - TypeScript coding standards and patterns
- **[react-standards.md](languages/react-standards.md)** - React 19 component patterns and best practices  
- **[python-standards.md](languages/python-standards.md)** - Python/FastAPI backend standards

### Testing & Quality
- **[tdd-approach.md](testing/tdd-approach.md)** - Test-driven development methodology
- **[playwright-debugging.md](testing/playwright-debugging.md)** - Browser automation debugging guide
- **[troubleshooting.md](testing/troubleshooting.md)** - Common issues and solutions

## Quick Reference

### Priority Order
1. **ALWAYS READ FIRST**: [ai-behavior.md](core/ai-behavior.md) - Contains critical security and quality rules
2. **Development Setup**: [local-development.md](development/local-development.md)
3. **Language Standards**: Based on what you're working on
4. **Testing**: [tdd-approach.md](testing/tdd-approach.md) for test requirements

### Key Principles
See [ai-behavior.md](core/ai-behavior.md) for complete list of critical rules and principles.

### Development Commands
```bash
# Setup
nvm use               # Use correct Node version
npm install          # Install dependencies

# Development
npm run dev          # Start frontend
wrangler dev         # Start backend
npm test            # Run tests

# Quality
npm run lint        # Check code style
npm run type-check  # TypeScript validation
npm run test:e2e    # End-to-end tests
```

### Technology Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 7, Tailwind CSS 4
- **Backend**: Cloudflare Workers, D1 Database  
- **Testing**: Vitest 3, Playwright, React Testing Library 16

## File Organization Notes

Files have been reorganized to eliminate duplication and improve clarity:
- Combined overlapping TypeScript/React standards
- Separated core principles from implementation details
- Grouped related guidelines into subdirectories
- Removed redundant information across files

## Contributing

When updating guidelines:
1. Check for existing information to avoid duplication
2. Update the relevant file in the appropriate subdirectory
3. Keep examples current with latest versions
4. Test all code examples before committing