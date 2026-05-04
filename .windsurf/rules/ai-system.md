---
trigger: always_on
description: AI-System operational details — scaffold, prompt template, LLM tier routing, OpenCode + MCP integration
---

# 1. ESTRUTURA DE SCAFFOLD

`ai-system/` na raiz do workspace:

```
ai-system/
  README.md, CONVENTIONS.md, LLM-ROUTING.md, PROMPT-TEMPLATE.md
  requests/<branch-name>/
    00-context/         # contexto pinado (specs, mocks, snapshots de MCPs)
    01-plan/            # master-plan.md, decision-log.md (ADR-lite)
    02-executors/{backend,frontend,database,devops}/  # criar só camadas usadas
    03-qa/
    04-orchestrator-feedback/
    05-deployment/
    STATUS.md           # single source of truth
    HANDOFF.md          # contrato executor → QA
  archive/
```

Se `ai-system/` não existir: pergunte antes de criar, popule via bootstrap pack, confirme antes de prosseguir.

Branch naming: `<type>/<kebab-summary>` onde type ∈ {feat, fix, refactor, chore, docs, test, perf, hotfix, spike}.
Task IDs: `<LAYER>-<NN>` (BE-01, FE-01, DB-01, OPS-01, QA-01).

# 2. STATUS.md (atualize a cada transição)

```yaml
request: feat/new-card
state: INTAKE | PLAN | SCAFFOLD | EXECUTING | QA | REROUTE | DEPLOY | DONE
opened_at: ISO-8601
last_update: ISO-8601
current_blockers: []
next_action: "..."
artifacts_pending: [...]
qa_runs: 0
```

# 3. HANDOFF.md (executor → QA, antes de gerar prompts de QA)

- Resumo do implementado (3-5 bullets)
- Arquivos criados/modificados (paths absolutos)
- Como testar localmente (comandos exatos)
- Riscos conhecidos / áreas frágeis
- Pontos de integração críticos

# 4. TEMPLATE OBRIGATÓRIO DE PROMPT

Todo prompt em `02-executors/**`:

```markdown
---
target_model: <ex: opencode-go/deepseek-v4-pro>
model_rationale: <1 frase>
fallback_models: [<provider/model-1>, <provider/model-2>]
layer: backend | frontend | database | devops
task_id: <ex: BE-01>
depends_on: [BE-00, ...]
estimated_complexity: low | medium | high
estimated_requests: low (<10) | medium (10-50) | high (>50)
context_files: [00-context/...]
parent_request: <branch-name>
version: 1
---

# ROLE
# CONTEXT
# TASK
# CONSTRAINTS (Stack, padrões, fora de escopo)
# ACCEPTANCE CRITERIA (testáveis)
# DELIVERABLES (arquivos a criar/modificar)
# DEFINITION OF DONE
# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "<provider/target_model>" "$(cat <path-to-this-prompt.md>)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "<provider/target_model>" "<path-to-this-prompt.md>"

# Descubra IDs corretos com: opencode models
```

QA (`03-qa/**`): YAML com `layer: qa`, `validates: [task_ids]`. Corpo: ROLE / SCOPE / TEST CASES (positivo, negativo, edge) / INTEGRATION CHECKS / PASS CRITERIA / FAIL → ROUTE TO.

# 5. MATRIZ DE ROTEAMENTO DE LLMs

> **Source of truth detalhado:** `ai-system/LLM-ROUTING.md` (matriz por tarefa, fallback chains de 3 níveis, benchmarks, calibração).

**Escolha por COMPLEXIDADE, não por camada.**

| Tier | Modelos | Use para |
|---|---|---|
| **1 — Volume** (~ilimitado) | DeepSeek V4 Flash, Qwen3.5 Plus, MiniMax M2.5 | Boilerplate, CRUD trivial, fix 1-2 arquivos, code review padrão, doc, spike |
| **2 — Standard** (~3.3k req/5h) | DeepSeek V4 Pro, Qwen3.6 Plus, MiniMax M2.7 | Feature 3-5 arquivos, lógica algorítmica, terminal-heavy, QA, DevOps |
| **3 — Elite** (~880-1.290 req/5h, deliberado) | Kimi K2.6, GLM-5.1, MiMo-V2.5-Pro | Refactor 10+ arquivos, arquitetura, spec, runs autônomos, review crítico |
| **4 — Especializado** | MiMo-V2-Omni (multimodal), GLM-5.1 (long-horizon 4-8h) | Vision-to-code, runs autônomos extensos |

**Cheat sheet de primários:**
- Trivial → **V4 Flash**
- CRUD/médio → **Qwen3.6 Plus** (Swiss Army knife, Terminal-Bench king)
- Lógica algorítmica → **V4 Pro** (LiveCodeBench king)
- Refactor longo / agêntico → **Kimi K2.6** (SWE-Pro king)
- Arquitetura / spec / long-horizon → **GLM-5.1** (reasoning king)
- Multimodal → **MiMo-V2-Omni** (única opção)
- Token-efficient → **MiMo-V2.5-Pro**

Versões antigas (GLM-5, Kimi K2.5, MiMo-V2-Pro/V2.5, Qwen3.5 Plus) → **fallback final**.

**Regras de seleção (ordem de prioridade):**
1. Imagem no input → **MiMo-V2-Omni** (não negociável).
2. Contexto > 50k tokens → **Kimi K2.6** primário.
3. Run autônomo > 4h → **GLM-5.1** primário.
4. Tarefa estimada > 100 reqs → **comece em Tier 1**, escale só se travar.
5. "Good enough" (CRUD, doc) → **Tier 1 sempre**.
6. Sessão pesada (>500 reqs gastos) → **desça um tier**.
7. Crítica + alta complexidade + < 100 reqs → **Tier 3 direto**.

**Concurrency caps (paralelismo seguro):**
- V4 Flash: 20 | Qwen3.6 Plus / V4 Pro / M2.7: 3-5 | Kimi K2.6 / MiMo-V2.5-Pro: **2** | GLM-5.1 / Omni: **1**
- Plano com mais paralelismo no Tier 3 → **divida em ondas**.

# 6. INTEGRAÇÃO OPENCODE + MCP

OpenCode é cliente MCP nativo. Configuração em `~/.config/opencode/opencode.json` (global) ou `opencode.json` (projeto). Use `model_fallback: true` + `runtime_fallback` (cooldown 60s, retry em 429/503/529) para failover automático em rate-limit.

**Princípio de divisão MCP entre camadas:**
- **Cascade (orquestrador)** → MCPs de **leitura/análise**: filesystem, github, supabase, atlassian, hubspot, context7, pinecone. Configurados em `~/.codeium/windsurf/mcp_config.json`. Use para PLAN: leia o estado do mundo e embarque snapshots em `00-context/`.
- **OpenCode (executor)** → MCPs de **escrita/execução**: filesystem, supabase, playwright, sentry, github, docker. Configurados em `opencode.json`. Use para EXECUTE: mute o estado do mundo conforme prompts.

Orquestrador NUNCA muta estado via MCP — apenas lê para planejar. Executores recebem snapshots prontos no `00-context/`, não consultam MCPs do orquestrador.