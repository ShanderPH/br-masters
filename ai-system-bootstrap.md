# AI-System — Bootstrap Pack

> Conteúdo dos arquivos que devem ser criados em `ai-system/` na primeira inicialização.
> Cada seção abaixo corresponde a um arquivo. Copie o conteúdo entre as marcações `=== FILE: ... ===` e `=== END FILE ===`.

---

## === FILE: ai-system/README.md ===

```markdown
# ai-system/

Repositório de orquestração de desenvolvimento com Cascade (Windsurf) como **Orquestrador/PM** e OpenCode CLI como **Executor multi-LLM**.

## Visão geral

Toda solicitação de desenvolvimento (feature, bug, refactor, etc.) gera uma pasta sob `requests/<branch-name>/` contendo:

- **Plano** (escopo, decomposição, decisões)
- **Contexto pinado** (specs, mocks, trechos de código)
- **Prompts de execução** divididos por camada (backend, frontend, database, devops)
- **Prompts de QA** com critérios de aceitação testáveis
- **Análises de feedback** quando há retrabalho
- **Plano de deploy** após aprovação

## Estrutura

```
ai-system/
├── README.md              # este arquivo
├── CONVENTIONS.md         # padrões de branch, prompt, código
├── LLM-ROUTING.md         # matriz de roteamento de LLMs
├── PROMPT-TEMPLATE.md     # template canônico de prompts
├── requests/              # solicitações ativas
│   └── <type>/<slug>/
│       ├── 00-context/
│       ├── 01-plan/
│       │   ├── master-plan.md
│       │   └── decision-log.md
│       ├── 02-executors/
│       │   ├── backend/
│       │   ├── frontend/
│       │   ├── database/
│       │   └── devops/
│       ├── 03-qa/
│       ├── 04-orchestrator-feedback/
│       ├── 05-deployment/
│       ├── STATUS.md
│       └── HANDOFF.md
└── archive/               # solicitações concluídas
```

## Fluxo de uso

1. **Inicie uma solicitação** no Cascade (Windsurf):
   - Use `/new <descrição>` ou apenas descreva o que precisa.
   - Cascade fará perguntas de clarificação (≤ 4) e proporá um nome de branch.

2. **Aprove o plano**:
   - Cascade gera `master-plan.md` e `decision-log.md`.
   - Revise. Peça ajustes se necessário.

3. **Execute os prompts no OpenCode**:
   - Cascade lista os prompts em ordem (respeitando dependências).
   - Para cada prompt:
     ```bash
     opencode run --model "<target_model>" --prompt-file "<path>"
     ```
   - Cole o output do OpenCode de volta no Cascade ou no arquivo do projeto.

4. **Sinalize conclusão**:
   - `/qa` → Cascade gera prompts de validação.
   - Rode os QAs no OpenCode (ou execute testes localmente conforme orientação).

5. **Em caso de falha**:
   - `/reroute <layer> <observação>` → Cascade analisa e gera correções versionadas (`.v2.prompt.md`).

6. **Após aprovação**:
   - `/deploy` → Cascade gera plano de deploy com sequência, smoke tests e rollback.

7. **Arquive**:
   - `/archive` move a request para `archive/`.

## Comandos rápidos

| Comando | Ação |
|---|---|
| `/new <descrição>` | Nova solicitação |
| `/status` | Estado da request ativa |
| `/qa` | Gerar prompts de QA |
| `/reroute <layer> <obs>` | Correção pós-falha |
| `/deploy` | Plano de deploy |
| `/archive` | Mover para arquivo |
| `/switch <branch>` | Trocar request ativa |
| `/audit` | Auditar consistência |

## Regras-chave

- **Cascade nunca codifica diretamente.** Sempre via prompts em `02-executors/`.
- **Um prompt = uma camada = uma tarefa coesa.**
- **Todo prompt declara `target_model` e `model_rationale`** (ver `LLM-ROUTING.md`).
- **Loops de feedback geram versões** (`.v2`, `.v3`), nunca sobrescritas.
- **`STATUS.md` é a fonte da verdade** sobre o estado de cada request.

## Manutenção

- Refine `LLM-ROUTING.md` conforme observar performance real dos modelos.
- Adicione padrões específicos de stack em `CONVENTIONS.md`.
- A global rule do Cascade é estável; ajustes finos vão nos arquivos deste diretório.
```

## === END FILE ===

---

## === FILE: ai-system/CONVENTIONS.md ===

```markdown
# Conventions

## Branch naming

Formato: `<type>/<kebab-case-summary>`

| Type | Uso |
|---|---|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `refactor/` | Reestruturação sem mudança de comportamento |
| `chore/` | Tooling, deps, configuração |
| `docs/` | Documentação apenas |
| `test/` | Testes apenas |
| `perf/` | Otimização de performance |
| `hotfix/` | Correção urgente em produção |
| `spike/` | Investigação / prova de conceito |

Exemplos:
- `feat/new-card`
- `fix/dashboard-responsivity`
- `refactor/auth-middleware`
- `perf/pinecone-query-cache`
- `hotfix/login-redirect-loop`

## Task IDs (dentro de uma request)

Formato: `<LAYER>-<NN>`
- Backend: `BE-01`, `BE-02`, ...
- Frontend: `FE-01`, ...
- Database: `DB-01`, ...
- DevOps: `OPS-01`, ...
- QA: `QA-01`, ...

Use o `task_id` no nome do arquivo: `BE-01-create-endpoint.prompt.md`.

## Prompt naming

```
02-executors/<layer>/<NN>-<task-slug>.prompt.md
03-qa/<NN>-<task-slug>-validation.prompt.md
04-orchestrator-feedback/<NN>-<task-slug>-analysis.md
```

Versionamento em loops de feedback: `<NN>-<task-slug>.v2.prompt.md`, `.v3...`.

## Padrões de código por stack

### Python (Django / FastAPI)
- Python 3.12+
- Type hints obrigatórios em todas as funções públicas
- Pydantic v2 para schemas
- `ruff` + `mypy` strict
- Docstrings Google-style em módulos, classes e funções públicas
- Sem `Any` salvo justificativa em comentário

### TypeScript (Next.js / React)
- TypeScript strict mode
- Sem `any` (use `unknown` + type guards)
- Componentes funcionais com hooks
- Tailwind para styling (sem CSS-in-JS salvo necessidade específica)
- ESLint + Prettier obrigatórios

### SQL / Migrations
- Nomenclatura snake_case
- Migrations idempotentes quando possível
- Sempre incluir `down` migration
- Índices documentados com justificativa

### N8N workflows
- Nomes de nodes descritivos (não "HTTP Request 3")
- Comentários sticky em pontos de decisão
- Variáveis sensíveis sempre via credentials, nunca hardcoded

## OpenCode CLI

Sintaxe padrão para invocação (ajuste conforme seu setup local):

```bash
opencode run --model "<target_model>" --prompt-file "<path>"
```

Se você usa wrapper/alias, documente aqui:

```bash
# Exemplo (substitua pelo seu setup real):
oc() { opencode run --model "$1" --prompt-file "$2"; }
oc "DeepSeek V4 Pro" "ai-system/requests/feat/new-card/02-executors/backend/01-create-endpoint.prompt.md"
```

## Definição de Done universal

Todo entregável passa por:
- [ ] Lint clean (ruff/eslint/etc.)
- [ ] Type check clean (mypy/tsc)
- [ ] Testes unitários quando aplicável
- [ ] Sem TODOs, FIXMEs, prints/console.logs deixados
- [ ] Critérios de aceitação do `master-plan.md` cobertos
- [ ] QA aprovou
```

## === END FILE ===

---

## === FILE: ai-system/LLM-ROUTING.md ===

```markdown
# LLM Routing Matrix

Matriz heurística para o orquestrador escolher o modelo correto no OpenCode.
**Refine esta tabela conforme observar performance real dos modelos.**

## Modelos disponíveis

| Modelo | Tier | Notas |
|---|---|---|
| GLM-5 | Padrão | Generalista de baixo custo |
| GLM-5.1 | Padrão+ | Boa prosa técnica |
| Kimi K2.5 | Long-context | Janela ampla |
| Kimi K2.6 | Long-context+ | Janela ainda maior |
| MiMo-V2-Pro | Pro | Raciocínio |
| MiMo-V2-Omni | Multimodal | **Único com visão** |
| MiMo-V2.5 | Padrão+ | Generalista médio |
| MiMo-V2.5-Pro | Pro+ | Raciocínio aprofundado |
| MiniMax M2.5 | Padrão | Generalista |
| MiniMax M2.7 | Padrão+ | Generalista versátil |
| Qwen3.5 Plus | Padrão+ | Forte em código |
| Qwen3.6 Plus | Pro | Forte em frontend e código tipado |
| DeepSeek V4 Pro | Pro+ | **Top-tier para código** |
| DeepSeek V4 Flash | Flash | Latência baixa, custo baixo |

## Matriz por tarefa

| Tarefa | Primário | Backup | Racional |
|---|---|---|---|
| Arquitetura / system design | DeepSeek V4 Pro | MiMo-V2.5-Pro | Raciocínio profundo |
| Backend lógico (Django/FastAPI) | DeepSeek V4 Pro | Qwen3.6 Plus | Geração tipada precisa |
| Frontend (Next.js/React/UI) | Qwen3.6 Plus | GLM-5.1 | Forte em JSX/TSX e Tailwind |
| Database (SQL/migrations/Pinecone) | DeepSeek V4 Pro | Qwen3.6 Plus | Precisão sintática |
| DevOps (Docker/CI-CD/IaC) | DeepSeek V4 Pro | MiMo-V2.5-Pro | Sintaxe de configs |
| Refactor longo (codebase inteiro) | Kimi K2.6 | Kimi K2.5 | Janela de contexto |
| Análise multimodal (mocks, screenshots) | MiMo-V2-Omni | — | Visão obrigatória |
| QA / geração de testes | MiMo-V2.5-Pro | DeepSeek V4 Pro | Raciocínio adversarial |
| Boilerplate / fix rápido / 1-liner | DeepSeek V4 Flash | GLM-5 | Latência e custo |
| Documentação / changelog | GLM-5.1 | MiniMax M2.7 | Prosa técnica |
| Spike / prototipagem | MiniMax M2.7 | GLM-5.1 | Generalista versátil |
| Tarefa híbrida / médio porte | MiMo-V2.5 | MiniMax M2.5 | Custo-benefício |

## Regras de seleção (ordem de prioridade)

1. **Input contém imagem** → `MiMo-V2-Omni` (não negociável).
2. **Contexto > 50k tokens** → família Kimi (`K2.6` preferido).
3. **Tarefa crítica + alta complexidade** → tier Pro+ (`DeepSeek V4 Pro` ou `MiMo-V2.5-Pro`).
4. **Tarefa rápida/repetitiva/baixo risco** → tier Flash (`DeepSeek V4 Flash`) para otimizar custo.
5. Em caso de empate → escolha o primário da matriz.
6. **`model_rationale` nunca pode ser vazio** no YAML do prompt.

## Notas de calibração

> Atualize esta seção com observações reais conforme rodar os modelos.

- **DeepSeek V4 Pro:** _(adicione observações após uso real)_
- **Qwen3.6 Plus:** _(adicione observações após uso real)_
- **Kimi K2.6:** _(adicione observações após uso real)_
- ...

## Quando trocar de modelo

Se um prompt falhar 2x no mesmo modelo:
1. Tente o backup da matriz.
2. Se falhar no backup, escale para o tier acima.
3. Se ainda falhar, o problema provavelmente é o **prompt**, não o modelo — refatore o prompt antes de trocar de modelo de novo.
```

## === END FILE ===

---

## === FILE: ai-system/PROMPT-TEMPLATE.md ===

```markdown
# Prompt Template — Canonical

Todo prompt em `02-executors/**` segue este template. Para `03-qa/**`, ajuste o corpo conforme indicado no final.

## Executor template

```markdown
---
target_model: <ex: DeepSeek V4 Pro>
model_rationale: <1 frase: por que este modelo>
layer: backend | frontend | database | devops
task_id: <ex: BE-01>
depends_on: [BE-00, DB-01]
estimated_complexity: low | medium | high
context_files:
  - 00-context/spec.md
  - 00-context/figma.png
parent_request: feat/new-card
version: 1
---

# ROLE
<persona específica e enxuta>

# CONTEXT
<problema, restrições do sistema atual, links para 00-context/, trechos de código relevantes inline ou referenciados>

# TASK
<descrição precisa, escopo limitado, lista numerada se houver passos>

# CONSTRAINTS
- Stack: <linguagem, frameworks, libs>
- Padrões obrigatórios: <type hints, lint, formatação>
- Não fazer: <fora de escopo>
- Convenções do projeto: ver CONVENTIONS.md

# ACCEPTANCE CRITERIA
- [ ] critério testável 1
- [ ] critério testável 2

# DELIVERABLES
- Arquivo(s) a criar/modificar (paths absolutos no repo do projeto)
- Formato: full files | unified diff | patch

# DEFINITION OF DONE
- [ ] Lint passa
- [ ] Type check passa
- [ ] Testes incluídos quando aplicável
- [ ] Sem TODO/FIXME/print/console.log
- [ ] Cobre os critérios de aceitação

# EXECUTION (OpenCode)
opencode run --model "<target_model>" --prompt-file "<path>"
```

## QA template (variação)

```markdown
---
target_model: <ex: MiMo-V2.5-Pro>
model_rationale: <1 frase>
layer: qa
task_id: QA-01
validates: [BE-01, FE-02]
parent_request: feat/new-card
version: 1
---

# ROLE
Senior QA Engineer com foco em <stack>.

# SCOPE
<o que está sendo validado>

# TEST CASES
1. **Positivo:** <cenário> → resultado esperado
2. **Negativo:** <cenário> → resultado esperado
3. **Edge:** <cenário> → resultado esperado

# INTEGRATION CHECKS
- Contrato API ↔ consumo no frontend
- Migration aplicada vs. queries do código
- <outros pontos de integração>

# PASS CRITERIA
- [ ] Todos os casos positivos passam
- [ ] Negativos retornam erros corretos
- [ ] DoD do master-plan.md coberto

# FAIL → ROUTE TO
- Se <falha tipo X>: layer=backend, task_id=BE-01
- Se <falha tipo Y>: layer=frontend, task_id=FE-02
- Se causa raiz desconhecida: gerar análise em 04-orchestrator-feedback/

# EXECUTION
opencode run --model "<target_model>" --prompt-file "<path>"
# Comandos locais para reproduzir testes:
# pytest tests/test_card.py -v
# npm run test -- card
```
```

## === END FILE ===

---

## Como usar este pacote

1. Quando o Cascade perguntar se deve inicializar `ai-system/`, responda **sim**.
2. Cascade pode criar os arquivos com base no conteúdo deste bootstrap pack (forneça o pacote no chat ou peça que ele leia este arquivo).
3. Após criação, ajuste `CONVENTIONS.md` com padrões específicos das suas stacks (Django/Ninja/Pinecone/N8N etc.) e `LLM-ROUTING.md` com observações reais.
4. A primeira solicitação real (`/new ...`) deve fluir limpa através do ciclo INTAKE → PLAN → SCAFFOLD → EXECUTE → QA → DEPLOY.
