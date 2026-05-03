#!/bin/bash

echo "🚀 Iniciando bootstrap de AI System..."

# -----------------------------
# 1. Criar nova branch
# -----------------------------
git checkout -b feat/ai-orchestration-foundation

# -----------------------------
# 2. Criar estrutura base
# -----------------------------
mkdir -p ai-system/orchestrator
mkdir -p ai-system/executors
mkdir -p ai-system/memory
mkdir -p ai-system/tasks/results
mkdir -p ai-system/workflows

mkdir -p services/api
mkdir -p packages/domain
mkdir -p packages/contracts
mkdir -p packages/db
mkdir -p infra/docker
mkdir -p infra/supabase

# -----------------------------
# 3. Criar arquivos de contexto
# -----------------------------
cat <<EOL > ai-system/memory/project.context.md
# PROJECT CONTEXT

Project: BR Masters

## CURRENT STATE
- Frontend: Next.js
- Database: Supabase
- No backend

## GOAL
- Introduce Python backend
- Move business logic out of frontend
EOL

# -----------------------------
# 4. Orchestrator prompts
# -----------------------------
cat <<EOL > ai-system/orchestrator/system.prompt.md
# ROLE: Autonomous Software Architect

You do NOT write code.

## RESPONSIBILITIES
- plan tasks
- assign executors
- validate outputs

## RULES
- backend owns logic
- frontend is thin
- db must be consistent
EOL

cat <<EOL > ai-system/orchestrator/reviewer.prompt.md
# ROLE: Code Reviewer

Check:
- architecture
- performance
- security

Output:
- issues
- fixes
- approval
EOL

# -----------------------------
# 5. Executors
# -----------------------------
cat <<EOL > ai-system/executors/backend.prompt.md
# ROLE: Backend Executor

Stack:
- Python FastAPI

Output:
- routers
- services
- schemas
EOL

cat <<EOL > ai-system/executors/frontend.prompt.md
# ROLE: Frontend Executor

Stack:
- Next.js App Router
- HeroUI

Output:
- pages
- components
EOL

cat <<EOL > ai-system/executors/db.prompt.md
# ROLE: Database Executor

Output:
- SQL migrations
- indexes
- constraints
EOL

# -----------------------------
# 6. Workflow
# -----------------------------
cat <<EOL > ai-system/workflows/feature.yaml
name: feature

steps:
  - plan
  - db
  - backend
  - frontend
  - review
EOL

# -----------------------------
# 7. Backend scaffold
# -----------------------------
cat <<EOL > services/api/main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}
EOL

# -----------------------------
# 8. README AI
# -----------------------------
cat <<EOL > ai-system/README.md
# AI Orchestration System

This folder contains autonomous AI system.

## Flow
User request → Orchestrator → Executors → Review

## Usage
- Add feature request
- Run orchestrator
EOL

# -----------------------------
# 9. Commit
# -----------------------------
git add .
git commit -m "feat: bootstrap AI orchestration system and architecture foundation"

echo "✅ Bootstrap concluído!"
echo "➡️ Próximo passo: integrar com Antigravity"