# Maximum Virtual Product GPT with Supabase Proxy

This repository contains a reference implementation of a backend proxy and OpenAPI specs for building a custom GPT that follows the **Maximum Virtual Product** methodology while integrating with a Supabase database and optionally GitHub.

## Overview

The goal of this project is to provide all the pieces you need to set up a custom GPT that can:

- Guide users through a 7-week AI product development cycle (strategy → problem definition → ideation → MVP design → data/models → experimentation) with KPI alignment.
- Store and retrieve project information, KPI targets and experiment logs using Supabase. A small Node/Express service is provided as a secure bridge to Supabase so that secrets never reach the GPT.
- (Optionally) Open GitHub issues or pull requests using a second OpenAPI spec.

## Directory Structure

```
maximum-virtual-product-gpt/
├── README.md
├── server/                   # Node/Express proxy service
│   ├── src/
│   │   └── index.ts          # Express server with Supabase endpoints
│   ├── package.json          # Project dependencies and scripts
│   ├── tsconfig.json         # TypeScript compiler configuration
│   └── .env.example          # Example environment variables
└── openapi/
    ├── actions.openapi.json  # OpenAPI spec for the Supabase proxy
    └── github.openapi.json   # (Optional) OpenAPI spec for GitHub issues/PRs
```

## Setup

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure env**
   Copy `.env.example` → `.env` and set:
   - `PORT` – default `8080`
   - `ALLOWED_GPT_BEARER` – long random token shared with your Custom GPT Actions
   - `SUPABASE_URL` – your project URL
   - `SUPABASE_SERVICE_KEY` – **service_role** key (server-side only)

3. **Run**
   ```bash
   npm run dev
   # or
   npm run build && npm start
   ```

## Endpoints

- `GET /health` – health check
- `GET /api/projects` – list projects (Bearer token required)
- `POST /api/projects` – create project
- `POST /api/kpis/targets` – add KPI target
- `POST /api/experiments` – log experiment

Import `openapi/actions.openapi.json` into **Custom GPT → Actions** and set the same Bearer token.

## Supabase Tables (SQL)

```sql
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists kpi_targets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text check (type in ('strategic','leading','operational','technical','outcome')) not null,
  metric text not null,
  target_value numeric not null,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  hypothesis text not null,
  method text,
  result_metric text,
  result_value numeric,
  notes text,
  created_at timestamptz not null default now()
);
```

## OpenAPI

- `openapi/actions.openapi.json` – proxy Actions for the GPT
- `openapi/github.openapi.json` – (optional) create GitHub issues

## License

MIT
