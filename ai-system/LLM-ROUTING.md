# LLM Routing Matrix — v2.1

> **Versão:** 2.1
> **Mudança v2.0 → v2.1:** corrige a sintaxe de execução do OpenCode CLI, adiciona mapeamento `provider/model`, e padroniza as seções acionáveis para IDs OpenCode.

---

## 1. Princípio central

> **Match capability to complexity, not layer to model.**

A pergunta certa **não** é "qual modelo para frontend?". É:
1. Quantos requests esta tarefa vai consumir? (1 / 10–50 / 100+)
2. Que tipo de raciocínio ela exige? (volume / lógica / agêntico longo / multimodal)
3. Quanto budget de janela de 5h ainda resta?

## 2. Realidade dos rate-limits (5h window)

| Modelo | Req/5h aprox. | Categoria de limite |
|---|---:|---|
| DeepSeek V4 Flash | 31.650 | **Efetivamente ilimitado** |
| Qwen3.6 Plus | 3.300 | Generoso |
| Qwen3.5 Plus | ~3.300 | Generoso |
| DeepSeek V4 Pro | 3.450 | Generoso |
| MiniMax M2.5 / M2.7 | ~2.500 | Médio |
| MiMo-V2.5 / V2.5-Pro | ~880–1.290 | **Apertado** |
| Kimi K2.6 / K2.5 | ~1.150 | **Apertado** |
| GLM-5 / GLM-5.1 | ~880 | **Mais apertado** |
| MiMo-V2-Omni | ~1.000 | Apertado (mas única opção multimodal) |

**Implicação:** uma sessão agêntica pesada (50–200 requests só em tool calls) estoura Kimi/GLM em 2–3 sessões. Use-os com parcimônia.

## 3. Benchmarks-chave (relevantes para roteamento)

| Modelo | SWE-Pro | SWE-Verified | Terminal-Bench | LiveCodeBench | Notas |
|---|---:|---:|---:|---:|---|
| Kimi K2.6 | **58.6%** | — | — | — | Melhor agentic coder do Go tier |
| GLM-5.1 | 58.4% | — | — | — | Melhor reasoning; runs de 8h autônomos |
| DeepSeek V4 Pro | 55.4% | 80.6% | — | **93.5%** | Campeão em algoritmos / código competitivo |
| Qwen3.6 Plus | — | — | **61.6%** | — | Líder em terminal/agêntico; supera Claude 4.5 |
| DeepSeek V4 Flash | — | 79% | — | — | "Good enough" para 80% das tarefas |
| MiMo-V2.5-Pro | — | — | — | — | 40–60% menos tokens com capacidade comparável (eficiência) |
| MiMo-V2-Omni | — | — | — | — | Único multimodal disponível |

Modelos sem dados de benchmark (Kimi K2.5, GLM-5, MiMo-V2-Pro/V2.5, MiniMax M2.5/M2.7, Qwen3.5 Plus) tratados como **gerações anteriores das versões listadas acima** — usar como último-fallback.

## 4. Tiers de modelo

### Tier 1 — Volume (cavalos de batalha)
**Modelos:** `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) · `opencode-go/qwen3.5-plus` (Qwen3.5 Plus) · `opencode-go/minimax-m2.5` (MiniMax M2.5)

**Use para:**
- Autocomplete-like / fixes triviais (1–2 arquivos, ≤30 linhas)
- Code review e PR feedback
- Agentes de busca/exploração (`Librarian`, `Explore` do oh-my-openagent)
- Geração de boilerplate, scaffolding
- Documentação rotineira, changelogs
- Spike rápido / prototipagem descartável
- Tarefas onde "good enough" é aceitável

**Por que:** `opencode-go/deepseek-v4-flash` é praticamente irrestrito em volume. **Nunca** desperdice Tier 3 onde Tier 1 resolve.

### Tier 2 — Standard Engineering (balanceado)
**Modelos:** `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) · `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) · `opencode-go/minimax-m2.7` (MiniMax M2.7)

**Use para:**
- Implementação de feature (3–5 arquivos)
- Backend lógico (Django/Ninja/FastAPI/APIs)
- Database (SQL, migrations, queries Pinecone)
- Frontend de média complexidade (componentes com estado, integrações)
- Debugging multi-step
- Terminal-heavy automation (N8N customizations, scripts)
- QA / geração de testes
- DevOps de média complexidade (Dockerfiles, CI básico)

**Por que:** ~3.300 req/5h é suficiente para sessões inteiras. `opencode-go/deepseek-v4-pro` lidera LiveCodeBench (lógica algorítmica). `opencode-go/qwen3.6-plus` lidera Terminal-Bench (validação real).

### Tier 3 — Elite Agêntico (deliberado)
**Modelos:** `opencode-go/kimi-k2.6` (Kimi K2.6) · `opencode-go/glm-5.1` (GLM-5.1) · `opencode-go/mimo-v2.5-pro` (MiMo-V2.5-Pro)

**Use para:**
- Refactor multi-arquivo (10+ arquivos)
- Arquitetura de sistema / system design
- Decisões arquiteturais (Oracle / spec-writing)
- Long-horizon autonomous runs (4–8h sem intervenção)
- Geração do `master-plan.md` em requests complexas
- Code review de mudanças críticas
- Análise de codebase inteiro (com Kimi pelo contexto longo)

**Por que:** limites apertados (~880–1.290 req/5h). Use apenas quando a complexidade exige. Para sessões longas, prefira `opencode-go/kimi-k2.6` (líder SWE-Pro agêntico). Para spec/arquitetura, prefira `opencode-go/glm-5.1` (melhor reasoning).

### Tier 4 — Especializado
- `opencode-go/mimo-v2-omni` (MiMo-V2-Omni): único multimodal — **obrigatório** quando o input contém imagem (mock, screenshot, diagrama).
- `opencode-go/glm-5.1` (GLM-5.1): runs autônomos extensos (8h+), spec-writing aprofundado.

## 5. Mapeamento de IDs OpenCode

| Nome humano | ID OpenCode (`provider/model`) | Tier |
|---|---|---|
| DeepSeek V4 Flash | `opencode-go/deepseek-v4-flash` | 1 |
| Qwen3.5 Plus | `opencode-go/qwen3.5-plus` | 1 |
| MiniMax M2.5 | `opencode-go/minimax-m2.5` | 1 |
| DeepSeek V4 Pro | `opencode-go/deepseek-v4-pro` | 2 |
| Qwen3.6 Plus | `opencode-go/qwen3.6-plus` | 2 |
| MiniMax M2.7 | `opencode-go/minimax-m2.7` | 2 |
| Kimi K2.6 | `opencode-go/kimi-k2.6` | 3 |
| GLM-5.1 | `opencode-go/glm-5.1` | 3 |
| MiMo-V2.5-Pro | `opencode-go/mimo-v2.5-pro` | 3 |
| MiMo-V2-Omni | `opencode-go/mimo-v2-omni` | 4 |
| Kimi K2.5 (legacy) | `opencode-go/kimi-k2.5` | fallback final |
| GLM-5 (legacy) | `opencode-go/glm-5` | fallback final |
| MiMo-V2-Pro (legacy) | `opencode-go/mimo-v2-pro` | fallback final |
| MiMo-V2.5 (legacy) | `opencode-go/mimo-v2.5` | fallback final |

### Modelos auxiliares (provider opencode/*)

| ID | Uso sugerido |
|---|---|
| `opencode/gpt-5-nano` | Tier 1 alternativo (latência baixa) |
| `opencode/minimax-m2.5-free` | Fallback grátis para tarefas Tier 1 |
| `opencode/nemotron-3-super-free` | Fallback grátis adicional |
| `opencode/hy3-preview-free` | Experimental — usar apenas em spike |
| `opencode/big-pickle` | Reservar até confirmar capacidade |

**Regra obrigatória:** todo campo `target_model` e `fallback_models` em prompts usa **exclusivamente** IDs OpenCode no formato `provider/model`. Nunca use nomes humanos sozinhos no YAML.

## 6. Matriz de roteamento por tarefa (com fallback chains)

| Tarefa | Primário | Fallback 1 | Fallback 2 | Tier |
|---|---|---|---|---|
| Arquitetura / system design | `opencode-go/glm-5.1` (GLM-5.1) | `opencode-go/kimi-k2.6` (Kimi K2.6) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | 3 |
| Master plan / spec-writing | `opencode-go/glm-5.1` (GLM-5.1) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | 3 |
| Refactor multi-arquivo (10+) | `opencode-go/kimi-k2.6` (Kimi K2.6) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 3 |
| Refactor médio (3–9 arquivos) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/kimi-k2.6` (Kimi K2.6) | 2 |
| Backend complexo (lógica algorítmica) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | 2 |
| Backend padrão (CRUD, integrações) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 1→2 |
| Frontend complexo (state, hooks avançados) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/glm-5.1` (GLM-5.1) | 2 |
| Frontend padrão (componente, layout, Tailwind) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/qwen3.5-plus` (Qwen3.5 Plus) | 1→2 |
| Database (SQL, migrations) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | 2 |
| Database simples (seed, query padrão) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | — | 1 |
| DevOps (Docker, CI/CD complexo) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/minimax-m2.7` (MiniMax M2.7) | 2 |
| DevOps simples (Dockerfile básico) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | — | 1 |
| QA / testes unitários | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | 2 |
| QA crítico / adversarial | `opencode-go/kimi-k2.6` (Kimi K2.6) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | 3 |
| Bug fix simples (1–2 arquivos) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | — | 1 |
| Bug fix complexo (multi-camada) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/kimi-k2.6` (Kimi K2.6) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 2 |
| Boilerplate / scaffolding | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/qwen3.5-plus` (Qwen3.5 Plus) | `opencode-go/minimax-m2.5` (MiniMax M2.5) | 1 |
| Code review (PR padrão) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | — | 1 |
| Code review (mudança crítica) | `opencode-go/kimi-k2.6` (Kimi K2.6) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 3 |
| Documentação técnica / changelog | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/minimax-m2.7` (MiniMax M2.7) | 1–2 |
| Análise multimodal (mock → código, screenshot) | `opencode-go/mimo-v2-omni` (MiMo-V2-Omni) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus)¹ | — | 4 |
| Long-context refactor (codebase inteiro) | `opencode-go/kimi-k2.6` (Kimi K2.6) | `opencode-go/kimi-k2.5` (Kimi K2.5) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | 3 |
| Long-horizon autonomous run (4–8h) | `opencode-go/glm-5.1` (GLM-5.1) | `opencode-go/kimi-k2.6` (Kimi K2.6) | — | 3–4 |
| Spike / prototipagem | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | `opencode-go/minimax-m2.7` (MiniMax M2.7) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 1 |
| Tarefa ambígua / médio porte | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | 2 |
| Token-efficient (contexto valioso, prompt longo) | `opencode-go/mimo-v2.5-pro` (MiMo-V2.5-Pro) | `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 3 |

¹ *Fallback de Omni para Qwen3.6 Plus só funciona se você converter imagem em descrição textual antes.*

## 7. Regras de seleção (em ordem de prioridade)

1. **Input contém imagem** → `opencode-go/mimo-v2-omni` (MiMo-V2-Omni) — sem fallback real.
2. **Contexto > 50k tokens** (codebase inteiro, refactor amplo) → `opencode-go/kimi-k2.6` (Kimi K2.6) primário.
3. **Run autônomo > 4h** → `opencode-go/glm-5.1` (GLM-5.1) primário.
4. **Tarefa estimada em > 100 requests** → comece em Tier 1 com `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash). Escale só se travar.
5. **Tarefa crítica + complexidade alta + < 100 requests** → Tier 3 direto (`opencode-go/kimi-k2.6` ou `opencode-go/glm-5.1`).
6. **Tarefa "good enough" (CRUD, boilerplate, doc)** → Tier 1 sempre.
7. **Sessão pesada já em curso (>500 reqs gastos)** → desça um tier do que escolheria normalmente.
8. **Empate** → escolha o primário da matriz.
9. **`model_rationale` nunca pode ser vazio** no YAML do prompt.

## 8. Concurrency caps (paralelismo seguro)

Quando o orquestrador despachar múltiplos prompts paralelos, **respeite estes limites**:

| Modelo | Max concurrent |
|---|---:|
| `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash) | 20 |
| `opencode-go/qwen3.6-plus` (Qwen3.6 Plus) | 5 |
| `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro) | 3 |
| `opencode-go/minimax-m2.7` (MiniMax M2.7) | 3 |
| `opencode-go/kimi-k2.6` (Kimi K2.6) | **2** |
| `opencode-go/mimo-v2.5-pro` (MiMo-V2.5-Pro) | 2 |
| `opencode-go/glm-5.1` (GLM-5.1) | **1** |
| `opencode-go/mimo-v2-omni` (MiMo-V2-Omni) | 1 |

**Regra prática:** se o plano gera 8 prompts paralelos no Tier 3, **divida em ondas** (2 prompts `opencode-go/kimi-k2.6` por vez, depois a próxima onda).

## 9. Configuração de fallback runtime no OpenCode

Adicione ao `~/.config/opencode/oh-my-openagent.json`:
```json
{
  "model_fallback": true,
  "runtime_fallback": {
    "enabled": true,
    "retry_on_errors": [400, 429, 503, 529],
    "max_fallback_attempts": 3,
    "cooldown_seconds": 60,
    "timeout_seconds": 30,
    "notify_on_fallback": true
  }
}
```
Quando um modelo bate rate-limit, ele entra em blacklist global por `cooldown_seconds`. Novas sessões pulam ele automaticamente até o cooldown expirar.

## 10. Estratégia para promoções/descontos

Se `opencode-go/kimi-k2.6` entrar em promoção (3x limite, ou similar):
- Promova `opencode-go/kimi-k2.6` a primário em **todas** as tarefas Tier 2 e Tier 3.
- Reverta quando a promoção acabar.

Mantenha `LLM-ROUTING.md` versionado em git para registrar essas mudanças temporárias.

## 11. Quando trocar de modelo (loop de feedback)

Se um prompt falhar 2x no mesmo modelo:
1. Tente `fallback 1` da matriz.
2. Se falhar, `fallback 2`.
3. Se ainda falhar → o problema é o **prompt**, não o modelo. Refatore o prompt antes de continuar trocando.

Documente falhas reincidentes em `decision-log.md` da request — alimenta calibração futura.

## 12. Notas de calibração (atualize com observações reais)

> Esta seção é um **diário vivo**. Atualize conforme rodar os modelos no seu workflow real.

- `opencode-go/kimi-k2.6` (Kimi K2.6): _(adicione observações reais)_
- `opencode-go/glm-5.1` (GLM-5.1): _(adicione observações reais)_
- `opencode-go/deepseek-v4-pro` (DeepSeek V4 Pro): _(adicione observações reais)_
- `opencode-go/deepseek-v4-flash` (DeepSeek V4 Flash): _(adicione observações reais)_
- `opencode-go/qwen3.6-plus` (Qwen3.6 Plus): _(adicione observações reais)_
- `opencode-go/mimo-v2.5-pro` (MiMo-V2.5-Pro): _(adicione observações reais)_
- `opencode-go/mimo-v2-omni` (MiMo-V2-Omni): _(adicione observações reais)_

## 13. Resumo executivo (cheat sheet)

```text
TRIVIAL/VOLUME         → opencode-go/deepseek-v4-flash (DeepSeek V4 Flash)
STANDARD/CRUD/MÉDIO    → opencode-go/qwen3.6-plus (Qwen3.6 Plus)
LÓGICA ALGORÍTMICA     → opencode-go/deepseek-v4-pro (DeepSeek V4 Pro)
TERMINAL/AGÊNTICO      → opencode-go/qwen3.6-plus (Qwen3.6 Plus)
REFACTOR LONGO         → opencode-go/kimi-k2.6 (Kimi K2.6)
ARQUITETURA / SPEC     → opencode-go/glm-5.1 (GLM-5.1)
LONG-HORIZON 4–8h      → opencode-go/glm-5.1 (GLM-5.1)
MULTIMODAL             → opencode-go/mimo-v2-omni (MiMo-V2-Omni)
TOKEN-EFFICIENT        → opencode-go/mimo-v2.5-pro (MiMo-V2.5-Pro)
```

---

**Fim. Versione este arquivo em git. Refine a cada sprint conforme observar performance real.**
