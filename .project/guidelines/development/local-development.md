# Local Development Strategy

## Overview

This document outlines our approach to local development using **native Wrangler development**. This strategy provides the fastest iteration cycles, simplest setup, and maintains full portability for future architecture changes.

## Core Philosophy

**"Move at the speed of thinking"** - Our local development approach must support rapid iteration while maintaining consistency across the team and preserving our ability to change deployment platforms if needed.

## Chosen Approach: Native Wrangler Development

### Why Native Tools?

1. **Runtime Reality**: Cloudflare Workers use V8 isolates, not containers. Wrangler v3 runs the exact same `workerd` runtime locally that runs in production.

2. **Performance**: 
   - 10x faster startup than containerized alternatives
   - 60x faster hot reload
   - Sub-second iteration cycles

3. **Simplicity**: 
   - Zero configuration required
   - Direct access to Chrome DevTools
   - No container boundaries to debug through

4. **Portability Preserved**: 
   - React + TypeScript code remains platform-agnostic
   - Drizzle ORM abstraction ensures database portability
   - Only the dev command changes if we switch platforms

## Local Development Setup

### Quick Start (< 5 minutes)

```bash
# 1. Use correct Node version
nvm use

# 2. Install dependencies
npm install

# 3. Start development servers
npm run dev          # Frontend at localhost:5173
wrangler dev         # Backend at localhost:8787
npx drizzle-kit studio # Database GUI (optional)
```

### Ensuring Consistency

#### Node Version Management

Create `.nvmrc` file:
```bash
echo "20.11.0" > .nvmrc
```

Team members use:
```bash
nvm use    # Automatically uses version from .nvmrc
```

#### Environment Variables

Frontend (`.env.local`):
```bash
VITE_API_URL=http://localhost:8787
VITE_AUTH0_DOMAIN=dev-tenant.auth0.com
```

Backend (`.dev.vars`):
```bash
AUTH0_DOMAIN=dev-tenant.auth0.com
AUTH0_API_AUDIENCE=https://api.example.com
DATABASE_URL=file:./local.db
```

#### Database Management

Local D1 database:
```bash
# Create local database
wrangler d1 create app-database --local

# Run migrations
wrangler d1 migrations apply app-database --local

# Use Drizzle Studio for GUI
npx drizzle-kit studio
```

## Development Workflows

### Standard Development

```bash
# Terminal 1: Frontend with HMR
npm run dev

# Terminal 2: Backend with hot reload
wrangler dev

# Terminal 3: Database GUI (optional)
npx drizzle-kit studio
```

### Remote Resource Access

When you need production data:
```bash
# Connect to remote resources
wrangler dev --remote

# Or mix local/remote in wrangler.toml
experimental_remote: true
```

### Testing Workflows

```bash
# Unit tests with Vitest
npm run test

# E2E tests with Playwright
npm run test:e2e
```

## Comparison with Alternatives

### Native Wrangler (Our Choice)
- ✅ **Pros**: Fast iteration, simple setup, exact production runtime
- ✅ **Cons**: Requires Node.js (mitigated by .nvmrc)
- **Verdict**: Optimal for rapid development

## Migration Flexibility

If we need to change our approach:

1. **Code remains unchanged**: React + TypeScript + Drizzle
2. **Only npm scripts change**: Update package.json
3. **Migration time**: < 1 hour
4. **No architectural impact**: Deployment stays the same

## Development Experience

| Aspect | Native Wrangler |
|--------|----------------|
| Initial startup | Fast |
| Hot reload | Instant |
| Memory usage | Efficient |
| Debug access | Direct |

## Common Issues & Solutions

### Issue: Node Version Mismatch
**Solution**: Always run `nvm use` before starting

### Issue: Port Conflicts
**Solution**: 
```bash
# Kill process on port
lsof -ti:8787 | xargs kill
```

### Issue: Database Connection
**Solution**: Ensure D1 database is created locally
```bash
wrangler d1 create app-database --local
```

## Best Practices

1. **Always use .nvmrc**: Ensures consistent Node version
2. **Never commit .dev.vars**: Contains secrets
3. **Use Drizzle Studio**: Visual database management
4. **Leverage HMR**: Both frontend and backend support it
5. **Test locally first**: Before deploying to preview

## AI Tool Compatibility

Our setup works seamlessly with:
- **Claude Code**: Standard tools it understands
- **Cursor**: Full IntelliSense support
- **GitHub Copilot**: Recognizes patterns
- **VS Code**: Full debugging capabilities

## Action Items for New Projects

1. ✅ Add `.nvmrc` with Node 20.11.0
2. ✅ Create `.dev.vars.example` template
3. ✅ Document setup in README.md
4. ✅ Optional: Add .devcontainer config
5. ✅ Set up pre-commit hooks for consistency

## Conclusion

Native Wrangler development provides the optimal balance of:
- **Speed**: Fastest possible iteration
- **Simplicity**: Minimal setup complexity
- **Flexibility**: Easy to change if needed
- **Compatibility**: Works with all tools

This approach aligns with our "move fast" philosophy while maintaining professional development standards.