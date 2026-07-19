# Sentinel AI Architecture Overview

Sentinel AI is built as an enterprise-grade full-stack application leveraging a Multi-Agent AI architecture.

## High-Level Stack
- **Frontend**: React 18, Vite, Material UI v9, React Query, React Flow.
- **Backend**: Node.js 24+, Express, Socket.io, PostgreSQL (pg-pool).
- **AI Engine**: OpenAI GPT-4o (via Official Node SDK).

## Core Concepts

### AEGIS Orchestrator (`server/src/ai/aegisOrchestrator.js`)
The core workflow engine. When an investigation is launched:
1. It queries the PostgreSQL database for all uploaded Evidence.
2. It loops through specialized Agent classes (Log, Network, Database, etc.).
3. Each Agent analyzes the evidence in parallel.
4. The Commander Agent aggregates the findings into a Root Cause and JSON postmortem.

### Socket.io Streaming (`server/src/sockets`)
During the AEGIS execution, the orchestrator triggers events via the global `io` instance. The React frontend listens to these events via `Socket.io-client` to render the Mission Control UI and Knowledge Graph animations in real-time.

### Database Layer (`server/src/repositories`)
All queries are written in raw PostgreSQL using `pg-pool`. We chose this over an ORM to maximize performance and demonstrate deep SQL expertise.

## Directory Structure
```
sentinel-ai/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI (AppShell, MissionControl)
│   │   ├── pages/          # React Router route components
│   │   ├── services/       # Axios API bindings
│   │   └── theme/          # Material UI custom theme
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── ai/             # AEGIS Engine and Agent classes
│   │   ├── controllers/    # Express route handlers
│   │   ├── db/             # PostgreSQL connection pool
│   │   ├── middleware/     # Rate limiters, JWT verification
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # API routing
│   │   └── sockets/        # WebSockets implementation
├── database/
│   └── migrations/         # SQL schema migrations
├── demo-data/              # Rich log files for demo scenarios
└── docs/                   # Markdown documentation
```
