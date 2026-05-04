# Prompt Template — Canonical

Todo prompt em `02-executors/**` segue este template. Para `03-qa/**`, use a variação de QA.

`target_model` e `fallback_models` devem usar exclusivamente IDs OpenCode no formato `provider/model`.

## Executor template

```markdown
---
target_model: <ex: opencode-go/deepseek-v4-pro>
model_rationale: <1 frase: por que este modelo>
fallback_models: [opencode-go/qwen3.6-plus, opencode-go/deepseek-v4-flash]
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
<problema, restrições do sistema atual, links para 00-context/>

# TASK
<descrição precisa e escopo limitado>

# CONSTRAINTS
- Stack: <linguagem, frameworks, libs>
- Padrões obrigatórios: <type hints, lint, formatação>
- Não fazer: <fora de escopo>
- Convenções do projeto: ver CONVENTIONS.md

# ACCEPTANCE CRITERIA
- [ ] critério testável 1
- [ ] critério testável 2

# DELIVERABLES
- Arquivo(s) a criar/modificar
- Formato: full files | unified diff | patch

# DEFINITION OF DONE
- [ ] Lint passa
- [ ] Type check passa
- [ ] Testes incluídos quando aplicável
- [ ] Sem TODO/FIXME/print/console.log
- [ ] Cobre os critérios de aceitação

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "<provider/target_model>" "$(cat <path-to-this-prompt.md>)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "<provider/target_model>" "<path-to-this-prompt.md>"

# Descubra IDs corretos com: opencode models
```

## QA template (variação)

```markdown
---
target_model: <ex: opencode-go/qwen3.6-plus>
model_rationale: <1 frase>
fallback_models: [opencode-go/deepseek-v4-pro, opencode-go/deepseek-v4-flash]
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
1. **Positivo:** <cenário> -> resultado esperado
2. **Negativo:** <cenário> -> resultado esperado
3. **Edge:** <cenário> -> resultado esperado

# INTEGRATION CHECKS
- Contrato API ↔ consumo no frontend
- Migration aplicada vs. queries do código
- <outros pontos de integração>

# PASS CRITERIA
- [ ] Todos os casos positivos passam
- [ ] Negativos retornam erros corretos
- [ ] DoD do master-plan.md coberto

# FAIL -> ROUTE TO
- Se <falha tipo X>: layer=backend, task_id=BE-01
- Se <falha tipo Y>: layer=frontend, task_id=FE-02
- Se causa raiz desconhecida: gerar análise em 04-orchestrator-feedback/

# EXECUTION
# Bash / Git Bash / zsh:
opencode run --model "<provider/target_model>" "$(cat <path-to-this-prompt.md>)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "<provider/target_model>" "<path-to-this-prompt.md>"

# Descubra IDs corretos com: opencode models
# Comandos locais para reproduzir testes:
# pytest tests/test_card.py -v
# npm run test -- card
```
