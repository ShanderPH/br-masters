# Rotas, Login e Segurança — Resumo de Implementação

## Visão Geral

Esta implementação abrange 7 etapas de melhorias focadas em rotas quebradas, segurança de autenticação, validação de depósitos, proteção contra brute force e padronização de código.

---

## ETAPA 1 — Rotas Quebradas Corrigidas

### Problema
Links para `/profile`, `/register`, `/about` e `/support` não tinham páginas correspondentes.

### Solução

| Rota | Arquivo | Tipo |
|------|---------|------|
| `/profile` | `src/app/profile/page.tsx` + `profile-client.tsx` | Server + Client |
| `/register` | `src/app/register/page.tsx` | Client |
| `/about` | `src/app/about/page.tsx` | Static |
| `/support` | `src/app/support/page.tsx` | Client |

### Constantes de Rota Centralizadas
- **Arquivo**: `src/lib/routes.ts`
- Define `ROUTES` com todas as rotas da aplicação (main + admin)
- Tipos `AppRoute` e `AdminRoute` exportados

### Componentes atualizados para usar `ROUTES`:
- `src/components/auth/login-screen.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/app/login/page.tsx`

---

## ETAPA 2 — Validação de Depósitos com Zod

### Problema
Validação manual de `amount`, `category` e `paymentMethod` no server sem type-safety.

### Solução
- **Schema**: `src/lib/schemas.ts` — `depositSchema` com Zod v4
  - `amount`: number, min 5, max 5000
  - `category`: enum `tournament_prize | round_prize | match_prize`
  - `paymentMethod`: enum `card | pix`
- **API**: `src/app/api/payments/process/route.ts` — substituiu validação manual por `depositSchema.safeParse()`
- Proteção contra NaN, Infinity e tipos não-numéricos

---

## ETAPA 3 — Login Dual Auth (Usuário + E-mail)

### Problema
Login apenas por nome de usuário com `UserSearchInput` que expunha lista de usuários (enumeração).

### Solução

#### Novo fluxo de autenticação:
- **Abas**: "Usuário" (ID do palpiteiro) e "E-mail" — alternância limpa entre tabs
- **Sem enumeração**: Removido `UserSearchInput` (dropdown com sugestões de usuários). Substituído por campo de texto simples para ID
- **Mensagens genéricas**: Todas as respostas de erro de login retornam a mesma mensagem (`GENERIC_LOGIN_ERROR`), impedindo identificação de se o usuário existe ou não

#### Arquivos modificados:
- `src/lib/auth/auth-service.ts` — Nova função `signInWithEmail()`, constante `GENERIC_LOGIN_ERROR`
- `src/hooks/use-auth.ts` — Novo método `loginWithEmail` no hook
- `src/app/login/page.tsx` — Handlers separados `handleLoginByUsername` e `handleLoginByEmail`
- `src/components/auth/login-screen.tsx` — Reescrito com tabs, props `onLoginByUsername` / `onLoginByEmail`

#### Mensagens de erro centralizadas:
- **Arquivo**: `src/lib/error-messages.ts`
- Categorias: Auth, Deposit, Profile, General

---

## ETAPA 4 — Proteção Contra Brute Force

### Problema
Sem limite de tentativas de login — vulnerável a ataques de força bruta.

### Solução
- **Hook**: `src/hooks/use-login-rate-limit.ts`
- **Tier 1**: 5 tentativas falhas → bloqueio de 30 segundos
- **Tier 2**: 10 tentativas falhas → bloqueio de 120 segundos
- Countdown visual exibido ao usuário
- Mensagem de aviso na última tentativa antes do bloqueio
- Reset automático após login bem-sucedido
- Integrado em `src/app/login/page.tsx`

---

## ETAPA 5 — Painel Admin

### Verificação
Todas as 9 rotas do admin sidebar verificadas com páginas existentes:
- `/admin` (Visão Geral)
- `/admin/users`, `/admin/tournaments`, `/admin/teams`
- `/admin/matches`, `/admin/predictions`, `/admin/scoring`
- `/admin/players`, `/admin/payments`

### Padronização
- Sidebar (`admin-shell.tsx`) atualizado para usar `ROUTES.ADMIN.*`
- `handleBackToApp` usa `ROUTES.DASHBOARD`

---

## ETAPA 7 — Melhorias Estruturais

### Arquivos criados:
| Arquivo | Propósito |
|---------|-----------|
| `src/lib/routes.ts` | Constantes de rota tipadas |
| `src/lib/schemas.ts` | Schemas Zod (login, registro, depósito) |
| `src/lib/error-messages.ts` | Mensagens de erro em PT-BR |
| `src/hooks/use-login-rate-limit.ts` | Rate limiting client-side |

---

## ETAPA 6 — Performance: Dashboard Parallel Queries

### Problema
Dashboard server page (`src/app/dashboard/page.tsx`) executava 7+ queries Supabase sequencialmente, adicionando latência desnecessária.

### Solução
- **Tier 1 parallelism**: `prizePool`, `rankingProfiles`, `upcomingMatches`, `totalPredictions` executam em `Promise.all` (4 queries simultâneas)
- **Tier 2 parallelism**: Após tier 1 resolver, `rankTeamsMap` e `predictedMatchIds` executam em paralelo
- Mantém sequencialidade obrigatória: auth → user → profile (dependências de dados)
- Redução estimada: ~40-60% no tempo de carregamento da dashboard

---

## Build

Build limpo com `next build` — 0 erros TypeScript, todas as 30 rotas geradas corretamente.
