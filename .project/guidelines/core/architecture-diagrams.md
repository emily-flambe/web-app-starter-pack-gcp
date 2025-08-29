# Architecture Diagrams

Visual representations of the Web App Starter Pack architecture using Mermaid diagrams.

## System Overview

```mermaid
graph TB
    subgraph "Client Browser"
        React[React App<br/>TypeScript + Vite]
    end
    
    subgraph "Cloudflare Edge Network"
        Worker[Worker API<br/>Hono Framework]
        D1[(D1 Database<br/>SQLite)]
    end
    
    subgraph "Development Environment"
        Dev1[Vite Dev Server<br/>:5173]
        Dev2[Wrangler Dev<br/>:8787]
        Dev3[Local D1<br/>SQLite]
    end
    
    React -->|HTTP/REST| Worker
    Worker -->|SQL| D1
    
    Dev1 -.->|Development| React
    Dev2 -.->|Development| Worker
    Dev3 -.->|Development| D1
```

## Request Flow

```mermaid
sequenceDiagram
    participant User
    participant React as React App
    participant API as API Client
    participant Worker as Worker API
    participant D1 as D1 Database
    
    User->>React: Interact with UI
    React->>API: Call API method
    API->>Worker: HTTP Request
    Worker->>D1: SQL Query
    D1-->>Worker: Result Set
    Worker-->>API: JSON Response
    API-->>React: Typed Data
    React-->>User: Update UI
```

## Directory Structure

```mermaid
graph TD
    Root[web-app-starter-pack/]
    
    Root --> Src[src/<br/>Frontend Application]
    Root --> Worker[worker/<br/>Backend API]
    Root --> DB[db/<br/>Database Schema]
    Root --> Public[public/<br/>Static Assets]
    Root --> E2E[e2e/<br/>End-to-End Tests]
    Root --> Project[.project/<br/>Documentation]
    
    Src --> Components[Components]
    Src --> Lib[lib/api/<br/>API Client]
    Src --> App[App.tsx<br/>Main Application]
    
    Worker --> Index[index.ts<br/>API Routes]
    
    DB --> Schema[schema.sql]
    DB --> Seed[seed.sql]
    
    Project --> Guidelines[guidelines/]
    Guidelines --> Core[core/]
    Guidelines --> Dev[development/]
    Guidelines --> Lang[languages/]
```

## Build & Deployment Pipeline

```mermaid
graph LR
    subgraph "Development"
        Code[Source Code]
        Local[Local Testing]
    end
    
    subgraph "Build Process"
        Vite[Vite Build<br/>Frontend Bundle]
        Wrangler[Wrangler Build<br/>Worker Bundle]
    end
    
    subgraph "Deployment"
        CF[Cloudflare Workers<br/>Global Edge Network]
        D1P[(Production D1)]
    end
    
    Code -->|npm run dev| Local
    Code -->|npm run build| Vite
    Code -->|wrangler deploy| Wrangler
    Vite --> CF
    Wrangler --> CF
    CF --> D1P
```

## API Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Components]
        Client[API Client<br/>src/lib/api/client.ts]
    end
    
    subgraph "API Layer"
        Routes[API Routes<br/>worker/index.ts]
        Handlers[Request Handlers]
        Validation[Input Validation]
    end
    
    subgraph "Data Layer"
        SQL[SQL Queries]
        D1[(D1 Database)]
        Schema[Database Schema]
    end
    
    UI --> Client
    Client -->|HTTP/JSON| Routes
    Routes --> Handlers
    Handlers --> Validation
    Validation --> SQL
    SQL --> D1
    D1 --> Schema
```

## Development Workflow

```mermaid
graph TD
    Start([Developer Starts])
    
    Start --> Setup{First Time?}
    Setup -->|Yes| Install[make setup<br/>Install & Configure]
    Setup -->|No| Dev[make dev<br/>Start Servers]
    
    Install --> Dev
    Dev --> Code[Write Code]
    
    Code --> Test{Test Type?}
    Test -->|Unit| Jest[npm run test]
    Test -->|E2E| Play[npm run test:e2e]
    Test -->|Manual| Browser[Browser Testing]
    
    Jest --> Commit
    Play --> Commit
    Browser --> Commit
    
    Commit[Git Commit]
    Commit --> CI[GitHub Actions<br/>CI/CD Pipeline]
    CI --> Deploy[make deploy<br/>Production]
```

## Technology Stack Layers

```mermaid
graph BT
    subgraph "Infrastructure"
        CF[Cloudflare Workers]
        D1[D1 Database]
        Edge[Edge Network]
    end
    
    subgraph "Backend"
        Hono[Hono Framework]
        SQL[Raw SQL]
        CORS[CORS Middleware]
    end
    
    subgraph "Frontend"
        React[React 18]
        TS[TypeScript]
        Vite[Vite]
        TW[Tailwind CSS]
    end
    
    subgraph "Tooling"
        Jest[Jest Testing]
        PW[Playwright E2E]
        GH[GitHub Actions]
    end
    
    D1 --> SQL
    CF --> Hono
    Hono --> CORS
    Edge --> CF
    
    React --> TS
    TS --> Vite
    Vite --> TW
    
    Jest --> React
    PW --> Edge
    GH --> CF
```

## Data Flow Pattern

```mermaid
stateDiagram-v2
    [*] --> UserAction: User Interaction
    UserAction --> ReactState: Update Local State
    ReactState --> APICall: Trigger API Call
    APICall --> WorkerReceive: HTTP Request
    
    WorkerReceive --> Validate: Input Validation
    Validate --> QueryDB: Execute SQL
    QueryDB --> Transform: Process Results
    Transform --> Response: JSON Response
    
    Response --> ClientReceive: Handle Response
    ClientReceive --> UpdateUI: Update React State
    UpdateUI --> [*]: Render Changes
    
    Validate --> ErrorResponse: Validation Error
    QueryDB --> ErrorResponse: Database Error
    ErrorResponse --> ClientError: Error Handling
    ClientError --> ShowError: Display Error
    ShowError --> [*]
```

## Environment Configuration

```mermaid
graph LR
    subgraph "Environment Files"
        ENV[.env.local<br/>Frontend Config]
        VARS[.dev.vars<br/>Worker Secrets]
        WRANGLER[wrangler.toml<br/>Worker Config]
    end
    
    subgraph "Development"
        ViteDev[Vite Dev Server]
        WranglerDev[Wrangler Dev]
    end
    
    subgraph "Production"
        Build[Built Assets]
        Worker[Worker Runtime]
        Secrets[CF Secrets]
    end
    
    ENV -->|VITE_* vars| ViteDev
    VARS -->|Secrets| WranglerDev
    WRANGLER -->|Config| WranglerDev
    
    ENV -->|Build Time| Build
    WRANGLER -->|Deploy| Worker
    Secrets -->|Runtime| Worker
```

## Security Boundaries

```mermaid
graph TB
    subgraph "Public Zone"
        Browser[Client Browser]
        Static[Static Assets<br/>JS/CSS/Images]
    end
    
    subgraph "Edge Zone"
        Worker[Worker API]
        Auth[Authentication<br/>Future]
        Validation[Input Validation]
    end
    
    subgraph "Data Zone"
        D1[(D1 Database)]
        Secrets[Environment Secrets]
    end
    
    Browser -->|HTTPS| Worker
    Static -->|CDN| Browser
    Worker --> Auth
    Auth --> Validation
    Validation -->|Prepared Statements| D1
    Worker -.->|Secure Access| Secrets
    
    style Auth stroke-dasharray: 5 5
```

## Testing Architecture

```mermaid
graph TD
    subgraph "Test Types"
        Unit[Unit Tests<br/>Jest + RTL]
        Integration[Integration Tests<br/>API Testing]
        E2E[E2E Tests<br/>Playwright]
    end
    
    subgraph "Test Targets"
        Components[React Components]
        Client[API Client]
        Routes[API Routes]
        Flow[User Flows]
    end
    
    subgraph "Test Environments"
        Local[Local Development]
        CI[GitHub Actions]
        Preview[Preview Deployments]
    end
    
    Unit --> Components
    Unit --> Client
    Integration --> Routes
    E2E --> Flow
    
    Local --> Unit
    Local --> E2E
    CI --> Unit
    CI --> Integration
    CI --> E2E
    Preview --> E2E
```