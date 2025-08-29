# Development Workflow

## Local Development Environment

> **Note**: We use native Wrangler development for optimal performance.
> See [local-development.md](./local-development.md) for detailed setup.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/web-app-starter-pack.git
cd web-app-starter-pack

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
cp .dev.vars.example .dev.vars

# Set up database
wrangler d1 create app-database --local
npx drizzle-kit push

# Start development servers (in separate terminals)
npm run dev          # Terminal 1: Vite frontend
wrangler dev         # Terminal 2: Worker backend
npx drizzle-kit studio # Terminal 3: Database GUI (optional)

# Open in browser
open http://localhost:5173
```

### Environment Setup

#### Prerequisites
- **Node.js**: 20.11.0 (managed via nvm and `.nvmrc`)
- **nvm**: Node Version Manager
- **npm**: 9+ or **pnpm**: 8+ (recommended)
- **Git**: 2.x+
- **Wrangler CLI**: `npm install -g wrangler`
- **VS Code**: Latest with recommended extensions

#### Node Version Management
```bash
# Ensure consistent Node version
nvm use  # Reads from .nvmrc
```

#### Environment Variables
```bash
# .env.local (Vite frontend)
VITE_API_URL=http://localhost:8787
VITE_AUTH0_DOMAIN=dev-your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-dev-client-id
VITE_AUTH0_AUDIENCE=your-dev-audience
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false

# .dev.vars (Wrangler backend)
DATABASE_URL=file:./local.db
AUTH0_DOMAIN=dev-your-domain.auth0.com
AUTH0_API_AUDIENCE=your-dev-audience
AUTH0_API_CLIENT_SECRET=your-dev-secret
```

### Development Scripts

#### Core Development Commands
```json
{
  "scripts": {
    // Development
    "dev": "vite --host",
    "dev:debug": "DEBUG=vite:* vite --host",
    "dev:https": "vite --host --https",
    
    // Building
    "build": "tsc --noEmit && vite build",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist/stats.json",
    "build:preview": "vite build && vite preview",
    
    // Testing
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    
    // Quality
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    
    // Database
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate:local": "wrangler d1 migrations apply app-database --local",
    "db:migrate:prod": "wrangler d1 migrations apply app-database",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts",
    
    // Deployment
    "deploy:dev": "wrangler deploy --env development",
    "deploy:staging": "wrangler deploy --env staging", 
    "deploy:prod": "wrangler deploy --env production",
    
    // Utilities
    "clean": "rm -rf dist node_modules/.vite",
    "reset": "npm run clean && npm install",
    "check-updates": "npx npm-check-updates"
  }
}
```

#### VS Code Integration
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "shell", 
      "command": "npm run dev",
      "group": "build",
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm test",
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "Type Check",
      "type": "shell", 
      "command": "npm run type-check",
      "group": "build",
      "problemMatcher": ["$tsc"]
    }
  ]
}
```

## Development Server Configuration

### Vite Development Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      // React 19 features
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          // Enable React 19 optimizations
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    tailwindcss()
  ],

  // Development server
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    open: true, // Auto-open browser
    cors: true,
    
    // Proxy API calls to avoid CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // Wrangler dev server
        changeOrigin: true,
        secure: false
      }
    },

    // Hot reload configuration
    hmr: {
      overlay: true // Show errors in browser
    }
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks')
    }
  },

  // Build optimizations for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@auth0/auth0-react'
    ],
    exclude: ['@vite/client', '@vite/env']
  },

  // Environment variables
  define: {
    __DEV__: JSON.stringify(true)
  }
})
```

### Wrangler Development
```toml
# wrangler.toml (development configuration)
[env.development]
name = "web-app-starter-pack-dev"
main = "dist/index.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

# Development variables
[env.development.vars]
NODE_ENV = "development"
API_BASE_URL = "http://localhost:8787"
CORS_ORIGIN = "http://localhost:5173"

# Local database for development
[[env.development.d1_databases]]
binding = "DB"
database_name = "development-db"
database_id = "dev-database-id"

# Development KV namespace
[[env.development.kv_namespaces]]
binding = "CACHE"
id = "dev-kv-namespace-id"
```

### Development Commands
```bash
# Terminal 1: Start Vite dev server (frontend)
npm run dev

# Terminal 2: Start Wrangler dev server (API - if using Workers)
npx wrangler dev --env development --port 8787

# Terminal 3: Run tests in watch mode
npm test

# Terminal 4: Type checking in watch mode
npm run type-check -- --watch
```

## Git Workflow

### Branch Strategy (GitHub Flow)
```
main (production)
├── develop (staging) 
├── feature/auth-integration
├── feature/dashboard-ui
├── hotfix/login-bug
└── chore/update-dependencies
```

### Commit Convention
```bash
# Conventional Commits format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples**:
```bash
git commit -m "feat(auth): add Auth0 integration with React 19 hooks"
git commit -m "fix(ui): resolve button loading state with useFormStatus"
git commit -m "docs: update deployment guide for Cloudflare Workers"
```

### Pre-commit Hooks
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "npm run type-check"
    ],
    "*.{js,jsx,json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Run tests for changed files  
npm run test -- --related --run

# Type check
npm run type-check
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx --no -- commitlint --edit ${1}
```

## Testing Workflow

### Test-Driven Development Cycle
```
1. Write failing test (Red)
2. Write minimal code to pass (Green) 
3. Refactor code while keeping tests green (Refactor)
4. Repeat
```

### Testing Commands
```bash
# Unit and integration tests
npm test                    # Watch mode
npm run test:coverage      # With coverage report
npm run test:ui           # Visual test runner

# E2E tests  
npm run test:e2e          # Headless mode
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:debug    # Debug mode

# Test specific files
npm test -- Button        # Test files matching "Button"
npm test -- --run        # Run once, don't watch
```

### Test Structure
```typescript
// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles loading state with useFormStatus', () => {
    // Mock useFormStatus to return pending state
    vi.mock('react', () => ({
      ...vi.importActual('react'),
      useFormStatus: () => ({ pending: true })
    }))

    render(<Button>Submit</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('calls onClick handler', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Test Structure
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login user successfully', async ({ page }) => {
    await page.goto('/')
    
    // Click login button
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to Auth0 login page
    await expect(page).toHaveURL(/auth0\.com/)
    
    // Fill login form (using test credentials)
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('[name="submit"]')
    
    // Should redirect back to app
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Welcome, Test User')).toBeVisible()
  })
})
```

## API Development

### Local API Development
```typescript
// api/index.ts (Cloudflare Workers)
import { createPlatformEnvironment, createDatabase } from '@/lib/platform'

interface Env {
  DB: D1Database
  CACHE: KVNamespace
  CORS_ORIGIN: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const platformEnv = createPlatformEnvironment(env, request)
    const db = createDatabase(platformEnv)
    
    // Handle CORS for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      const url = new URL(request.url)
      const response = await handleApiRequest(url.pathname, request, db)
      
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      console.error('API Error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
  }
}

async function handleApiRequest(
  pathname: string, 
  request: Request, 
  db: DatabaseProvider
): Promise<Response> {
  // Route handling logic
  if (pathname === '/api/health') {
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
  }

  if (pathname.startsWith('/api/users')) {
    return handleUsersApi(pathname, request, db)
  }

  return new Response('Not Found', { status: 404 })
}
```


## Preview Environments

### Pull Request Previews
```yaml
# .github/workflows/preview.yml
name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: https://web-app-starter-pack-pr-${{ github.event.number }}.your-domain.workers.dev
      
      - name: Deploy Preview
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --name web-app-starter-pack-pr-${{ github.event.number }}
      
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const previewUrl = `https://web-app-starter-pack-pr-${{ github.event.number }}.your-domain.workers.dev`
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed: ${previewUrl}`
            })
```

### Staging Environment
```bash
# Deploy to staging
npm run deploy:staging

# Staging URL: https://staging.your-app.com
# Features:
# - Production-like environment
# - Real database (non-production)
# - Auth0 staging tenant
# - Performance monitoring
# - Error tracking
```

## Database Development

### Local Database Setup (SQLite with Drizzle)
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/database/schema.ts',
  out: './migrations',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: './local.db'
  }
})
```

### Database Scripts
```bash
# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### Seed Script
```typescript
// scripts/seed.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { users, todos } from '@/lib/database/schema'

const db = drizzle(new Database('./local.db'))

async function seed() {
  console.log('Seeding development database...')
  
  // Insert test users
  await db.insert(users).values([
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    },
    {
      id: '2', 
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user'
    }
  ])

  // Insert test todos
  await db.insert(todos).values([
    {
      id: '1',
      title: 'Complete project setup',
      completed: true,
      userId: '1'
    },
    {
      id: '2',
      title: 'Write documentation',
      completed: false,
      userId: '1'
    }
  ])

  console.log('Database seeded successfully!')
}

seed().catch(console.error)
```

## Debugging

### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "/@/*": "${workspaceFolder}/src/*"
      }
    },
    {
      "name": "Debug Tests", 
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### Browser DevTools
- **React DevTools**: Debug React 19 components and hooks
- **Network Tab**: Monitor API calls and responses
- **Performance Tab**: Profile rendering and identify bottlenecks
- **Application Tab**: Inspect localStorage, sessionStorage, and service workers

### Error Tracking
```typescript
// src/lib/error-tracking.ts
interface ErrorContext {
  userId?: string
  route?: string
  userAgent?: string
  timestamp: string
}

export function trackError(error: Error, context?: Partial<ErrorContext>) {
  const fullContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    route: window.location.pathname,
    userAgent: navigator.userAgent,
    ...context
  }

  // In development, log to console
  if (import.meta.env.DEV) {
    console.group('🚨 Error Tracked')
    console.error(error)
    console.table(fullContext)
    console.groupEnd()
    return
  }

  // In production, send to error tracking service
  if (import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true') {
    // Send to Sentry, LogRocket, etc.
    console.error('Error tracked:', error, fullContext)
  }
}
```

This development workflow ensures a smooth, efficient development experience with modern tooling and best practices.