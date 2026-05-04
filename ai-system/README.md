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

```text
ai-system/
├── README.md
├── CONVENTIONS.md
├── LLM-ROUTING.md
├── PROMPT-TEMPLATE.md
├── requests/
│   └── <branch-name>/
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
└── archive/
```

## Fluxo de uso

1. **Inicie uma solicitação** com `/new <descrição>`.
2. **Aprove o plano** em `01-plan/`.
3. **Execute os prompts no OpenCode**:
   ```bash
   opencode run --model "<provider/target_model>" "$(cat <path-to-this-prompt.md>)"
   # ou
   ocrun "<provider/target_model>" "<path-to-this-prompt.md>"
   ```
4. **Sinalize conclusão** e rode `/qa`.
5. **Se falhar**, use `/reroute <layer> <observação>`.
6. **Após aprovação**, rode `/deploy`.
7. **Arquive** com `/archive`.

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
- **Todo prompt declara `target_model` e `model_rationale`.**
- **Loops de feedback geram versões** (`.v2`, `.v3`), nunca sobrescritas.
- **`STATUS.md` é a fonte da verdade** sobre o estado de cada request.
