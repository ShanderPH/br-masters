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

## Task IDs (dentro de uma request)

Formato: `<LAYER>-<NN>`
- Backend: `BE-01`, `BE-02`, ...
- Frontend: `FE-01`, ...
- Database: `DB-01`, ...
- DevOps: `OPS-01`, ...
- QA: `QA-01`, ...

Use o `task_id` no nome do arquivo: `BE-01-create-endpoint.prompt.md`.

## Prompt naming

```text
02-executors/<layer>/<NN>-<task-slug>.prompt.md
03-qa/<NN>-<task-slug>-validation.prompt.md
04-orchestrator-feedback/<NN>-<task-slug>-analysis.md
```

Versionamento em loops de feedback: `<NN>-<task-slug>.v2.prompt.md`, `.v3...`.

## OpenCode CLI helpers

### Wrapper `ocrun` 

Para reduzir fricção ao invocar prompts a partir de arquivos, adicione ao seu `~/.bashrc` (Linux / macOS / Git Bash):

```bash
ocrun() {
  local model="$1"
  local prompt_file="$2"
  if [ -z "$model" ] || [ -z "$prompt_file" ]; then
    echo "Uso: ocrun <provider/model> <caminho/para/prompt.md>"
    return 1
  fi
  if [ ! -f "$prompt_file" ]; then
    echo "Arquivo não encontrado: $prompt_file"
    return 1
  fi
  opencode run --model "$model" "$(cat "$prompt_file")"
}
```

Após adicionar, rode `source ~/.bashrc`.

Uso:

```bash
ocrun "opencode-go/deepseek-v4-flash" "ai-system/requests/feat/<branch>/02-executors/backend/BE-01-task.prompt.md"
```

## Definição de Done universal

Todo entregável passa por:
- [ ] Lint clean
- [ ] Type check clean
- [ ] Testes unitários quando aplicável
- [ ] Sem TODOs, FIXMEs, prints/console.logs deixados
- [ ] Critérios de aceitação do `master-plan.md` cobertos
- [ ] QA aprovou
