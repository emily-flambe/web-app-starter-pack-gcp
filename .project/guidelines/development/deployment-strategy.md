# Deployment Strategy

## Overview

Our deployment strategy prioritizes **platform portability** while leveraging Cloudflare Workers' performance advantages. The architecture uses abstraction layers to enable easy migration between platforms without code changes.

## Primary Platform: Cloudflare Workers

### Why Cloudflare Workers

**Performance Advantages**:
- **Sub-10ms cold starts**: V8 isolates vs traditional container cold starts
- **Global edge deployment**: 300+ locations worldwide
- **Automatic scaling**: Handle traffic spikes without configuration
- **Cost efficiency**: Pay-per-request model with generous free tier

**Developer Experience**:
- **Vite integration**: Native support with `@cloudflare/vite-plugin-workers`
- **Local development**: Wrangler dev server with hot reload
- **TypeScript-first**: Full TypeScript support and type safety
- **Modern web standards**: Web APIs, Fetch, Streams, WebCrypto

**Ecosystem Integration**:
- **D1 Database**: Serverless SQLite with global replication
- **R2 Storage**: S3-compatible object storage
- **KV Storage**: Global key-value storage with edge caching
- **Pages Integration**: Static site hosting with dynamic functions

### Architecture Pattern

```
┌─────────────────────────────────────┐
│        Frontend (Static)            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     React 19 SPA            │    │
│  │  - Vite build output        │    │
│  │  - Static assets            │    │
│  │  - Service worker           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
                  │
                  ▼ API calls
┌─────────────────────────────────────┐
│      Cloudflare Workers             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    API Handler Functions    │    │
│  │  - Request routing          │    │
│  │  - Business logic           │    │
│  │  - Authentication           │    │
│  │  - Data validation          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Cloudflare Services       │    │
│  │  - D1 Database              │    │
│  │  - KV Storage               │    │
│  │  - R2 Object Storage        │    │
│  │  - Analytics                │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Deployment Configuration

### Project Structure
```
project/
├── src/                    # Frontend application
├── worker/                 # Cloudflare Worker backend
│   ├── index.ts           # Worker entry point
│   └── db/                # Database access layer
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # Drizzle schema definitions
│   └── migrations/        # Version-controlled migrations
├── wrangler.toml          # Cloudflare configuration
├── drizzle.config.ts      # Drizzle ORM configuration
├── .env.local             # Frontend environment variables
├── .dev.vars              # Backend environment variables
└── deploy/
    ├── cloudflare.yml     # Cloudflare-specific deployment
    ├── vercel.json        # Vercel configuration
    └── netlify.toml       # Netlify configuration
```

### Wrangler Configuration
```toml
name = "web-app-starter-pack"
compatibility_date = "2025-01-01"
main = "worker/index.ts"

# Assets configuration for SPA
[assets]
directory = "./dist"
not_found_handling = "single-page-application"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "app-database"
database_id = "your-database-id"

# KV namespace for caching (optional)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# Environment variables (non-sensitive)
[vars]
NODE_ENV = "production"
AUTH0_DOMAIN = "your-domain.auth0.com"
AUTH0_AUDIENCE = "https://api.example.com"

# Database configuration
[[d1_databases]]
binding = "DB"
database_name = "production-db"
database_id = "your-database-id"

# KV storage for sessions/cache
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# R2 storage for file uploads
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "app-uploads"

# Custom domain configuration
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"

# Development environment
[env.development]
name = "web-app-starter-pack-dev"
vars = { NODE_ENV = "development" }

[[env.development.d1_databases]]
binding = "DB"
database_name = "development-db"
database_id = "your-dev-database-id"

# Staging environment
[env.staging]
name = "web-app-starter-pack-staging"
vars = { NODE_ENV = "staging" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "staging-db"
database_id = "your-staging-database-id"
```

### Vite Configuration for Cloudflare
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin-workers'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Cloudflare Workers integration
    cloudflare({
      // Optional: specify worker entry point if using worker functions
      worker: './api/index.ts'
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  build: {
    // Optimize for Cloudflare Workers
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'auth': ['@auth0/auth0-react']
        }
      }
    }
  },

  // Cloudflare-specific optimizations
  define: {
    // Ensure environment variables are available
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})
```

## Database Deployment Strategy

### D1 Database Setup

#### Initial Configuration
```bash
# Create D1 database
wrangler d1 create app-database

# Generate initial migration
npx drizzle-kit generate

# Apply migrations to local database
wrangler d1 migrations apply app-database --local

# Apply migrations to production
wrangler d1 migrations apply app-database
```

#### Drizzle Configuration
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: process.env.NODE_ENV === 'production' 
      ? 'app-database' 
      : 'app-database-dev',
  },
} satisfies Config
```

#### Migration Workflow
1. **Schema Development**: Define/modify schemas in `drizzle/schema.ts`
2. **Generate Migrations**: `npx drizzle-kit generate`
3. **Local Testing**: `wrangler d1 migrations apply app-database --local`
4. **Production Deploy**: `wrangler d1 migrations apply app-database`
5. **Rollback** (if needed): Keep previous schema versions for rollback

#### Portability Principles
- **Use Standard SQL**: Avoid D1-specific features
- **Repository Pattern**: All DB access through repositories
- **Type Safety**: Leverage Drizzle's TypeScript integration
- **Migration Scripts**: Keep platform-agnostic SQL

## Platform Abstraction Layer

### Environment Service
```typescript
// src/lib/platform/environment.ts
interface PlatformEnvironment {
  // Platform detection
  isCloudflareWorkers(): boolean
  isVercel(): boolean
  isNetlify(): boolean
  isLocal(): boolean

  // Environment variables
  get(key: string): string | undefined
  require(key: string): string

  // Platform-specific context
  getRequest?(): Request
  getEnv?(): Record<string, any>
}

class CloudflareEnvironment implements PlatformEnvironment {
  constructor(private env: Record<string, any>, private request?: Request) {}

  isCloudflareWorkers() { return true }
  isVercel() { return false }
  isNetlify() { return false }
  isLocal() { return false }

  get(key: string) {
    return this.env[key]
  }

  require(key: string) {
    const value = this.get(key)
    if (!value) {
      throw new Error(`Environment variable ${key} is required`)
    }
    return value
  }

  getRequest() {
    return this.request
  }

  getEnv() {
    return this.env
  }
}

class BrowserEnvironment implements PlatformEnvironment {
  isCloudflareWorkers() { return false }
  isVercel() { return !!import.meta.env.VERCEL }
  isNetlify() { return !!import.meta.env.NETLIFY }
  isLocal() { return import.meta.env.DEV }

  get(key: string) {
    return import.meta.env[key]
  }

  require(key: string) {
    const value = this.get(key)
    if (!value) {
      throw new Error(`Environment variable ${key} is required`)
    }
    return value
  }
}

// Factory function
export function createPlatformEnvironment(
  env?: Record<string, any>,
  request?: Request
): PlatformEnvironment {
  // Server-side (Cloudflare Workers)
  if (env && typeof window === 'undefined') {
    return new CloudflareEnvironment(env, request)
  }
  
  // Client-side (Browser)
  return new BrowserEnvironment()
}
```

### Database Abstraction with Drizzle ORM
```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../../drizzle/schema'

export type Database = ReturnType<typeof drizzle>

export function getDb(env: { DB: D1Database }): Database {
  return drizzle(env.DB, { schema })
}

// Repository pattern for portability
export class SubscriptionRepository {
  constructor(private db: Database) {}
  
  async create(data: typeof schema.subscriptions.$inferInsert) {
    return this.db.insert(schema.subscriptions).values(data).returning()
  }
  
  async findById(id: string) {
    return this.db.select().from(schema.subscriptions)
      .where(eq(schema.subscriptions.id, id))
  }
  
  // Platform-agnostic methods
  async list(limit = 10, offset = 0) {
    return this.db.select().from(schema.subscriptions)
      .limit(limit)
      .offset(offset)
  }
}

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.db.prepare(sql).bind(...params).all()
    return result.results as T[]
  }

  async execute(sql: string, params: any[] = []) {
    const result = await this.db.prepare(sql).bind(...params).run()
    return {
      success: result.success,
      meta: result.meta
    }
  }

  async transaction<T>(fn: (db: DatabaseProvider) => Promise<T>): Promise<T> {
    // D1 doesn't support transactions yet, so we simulate it
    return fn(this)
  }
}

class PostgreSQLProvider implements DatabaseProvider {
  // Implementation for PostgreSQL (Supabase, Neon, etc.)
  constructor(private connectionString: string) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // PostgreSQL implementation
    throw new Error('PostgreSQL provider not implemented')
  }

  async execute(sql: string, params: any[] = []) {
    // PostgreSQL implementation
    throw new Error('PostgreSQL provider not implemented')
  }

  async transaction<T>(fn: (db: DatabaseProvider) => Promise<T>): Promise<T> {
    // PostgreSQL transaction implementation
    throw new Error('PostgreSQL provider not implemented')
  }
}

// Database service factory
export function createDatabase(env: PlatformEnvironment): DatabaseProvider {
  if (env.isCloudflareWorkers()) {
    const db = (env as any).getEnv().DB as D1Database
    return new CloudflareD1Provider(db)
  }

  // Fallback to PostgreSQL for other platforms
  const connectionString = env.require('DATABASE_URL')
  return new PostgreSQLProvider(connectionString)
}
```

### API Handler Abstraction
```typescript
// src/lib/platform/handler.ts
interface ApiHandler {
  (request: Request, env: PlatformEnvironment): Promise<Response>
}

interface RouteHandler {
  (params: { request: Request; env: PlatformEnvironment; params: Record<string, string> }): Promise<Response>
}

class ApiRouter {
  private routes: Map<string, { pattern: RegExp; handler: RouteHandler }> = new Map()

  get(path: string, handler: RouteHandler) {
    const pattern = this.pathToRegex(path)
    this.routes.set(`GET:${path}`, { pattern, handler })
  }

  post(path: string, handler: RouteHandler) {
    const pattern = this.pathToRegex(path)
    this.routes.set(`POST:${path}`, { pattern, handler })
  }

  put(path: string, handler: RouteHandler) {
    const pattern = this.pathToRegex(path)
    this.routes.set(`PUT:${path}`, { pattern, handler })
  }

  delete(path: string, handler: RouteHandler) {
    const pattern = this.pathToRegex(path)
    this.routes.set(`DELETE:${path}`, { pattern, handler })
  }

  private pathToRegex(path: string): RegExp {
    // Convert path parameters to regex groups
    const regexPath = path.replace(/:(\w+)/g, '(?<$1>[^/]+)')
    return new RegExp(`^${regexPath}$`)
  }

  async handle(request: Request, env: PlatformEnvironment): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method
    const pathname = url.pathname

    for (const [key, { pattern, handler }] of this.routes) {
      const [routeMethod] = key.split(':')
      if (routeMethod !== method) continue

      const match = pathname.match(pattern)
      if (match) {
        const params = match.groups || {}
        return handler({ request, env, params })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}

// Example API routes
const router = new ApiRouter()

router.get('/api/health', async ({ request, env }) => {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.get('/api/users/:id', async ({ request, env, params }) => {
  const db = createDatabase(env)
  const users = await db.query('SELECT * FROM users WHERE id = ?', [params.id])
  
  if (users.length === 0) {
    return new Response('User not found', { status: 404 })
  }

  return Response.json(users[0])
})

// Main handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const platformEnv = createPlatformEnvironment(env, request)
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    }

    try {
      const response = await router.handle(request, platformEnv)
      
      // Add CORS headers to all responses
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      return response
    } catch (error) {
      console.error('API Error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
```

## Alternative Platform Support

### Vercel Configuration
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "VITE_API_URL": "https://your-app.vercel.app"
    }
  }
}
```

### Netlify Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[build.environment]
  NODE_ENV = "production"
  VITE_API_URL = "https://your-app.netlify.app"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

### AWS Lambda Configuration
```yaml
# serverless.yml
service: web-app-starter-pack

provider:
  name: aws
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1

functions:
  api:
    handler: api/index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-webpack

custom:
  webpack:
    webpackConfig: webpack.config.js
    includeModules: true
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: E2E tests
        run: npm run test:e2e
        env:
          CI: true

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.PREVIEW_API_URL }}
      
      - name: Deploy to Cloudflare Workers (Preview)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env development

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.STAGING_API_URL }}
          VITE_AUTH0_DOMAIN: ${{ secrets.STAGING_AUTH0_DOMAIN }}
          VITE_AUTH0_CLIENT_ID: ${{ secrets.STAGING_AUTH0_CLIENT_ID }}
      
      - name: Deploy to Cloudflare Workers (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}
          VITE_AUTH0_DOMAIN: ${{ secrets.PRODUCTION_AUTH0_DOMAIN }}
          VITE_AUTH0_CLIENT_ID: ${{ secrets.PRODUCTION_AUTH0_CLIENT_ID }}
      
      - name: Deploy to Cloudflare Workers (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

## Migration Strategy

### Platform Migration Guide
```typescript
// src/lib/platform/migration.ts
interface MigrationPlan {
  from: string
  to: string
  steps: MigrationStep[]
  estimatedTime: string
  risks: string[]
}

const migrationPlans: Record<string, MigrationPlan> = {
  'cloudflare-to-vercel': {
    from: 'Cloudflare Workers',
    to: 'Vercel',
    steps: [
      {
        step: 1,
        title: 'Update environment variables',
        description: 'Convert VITE_* variables to Vercel format',
        automated: true
      },
      {
        step: 2,
        title: 'Database migration',
        description: 'Export D1 data and import to PostgreSQL',
        automated: false
      },
      {
        step: 3,
        title: 'Update API handlers',
        description: 'Convert Worker handlers to Vercel functions',
        automated: true
      },
      {
        step: 4,
        title: 'Deploy and test',
        description: 'Deploy to Vercel and run integration tests',
        automated: true
      }
    ],
    estimatedTime: '2-4 hours',
    risks: [
      'Database data migration required',
      'Potential API latency differences',
      'Different caching behavior'
    ]
  }
}
```

### Deployment Scripts
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-development}
PLATFORM=${2:-cloudflare}

echo "Deploying to $PLATFORM ($ENVIRONMENT)..."

# Build the application
npm run build

case $PLATFORM in
  cloudflare)
    wrangler deploy --env $ENVIRONMENT
    ;;
  vercel)
    vercel --prod --env $ENVIRONMENT
    ;;
  netlify)
    netlify deploy --prod --dir dist
    ;;
  aws)
    serverless deploy --stage $ENVIRONMENT
    ;;
  *)
    echo "Unknown platform: $PLATFORM"
    exit 1
    ;;
esac

echo "Deployment complete!"
```

This deployment strategy ensures maximum flexibility while providing excellent performance through Cloudflare Workers, with clear migration paths to other platforms when needed.