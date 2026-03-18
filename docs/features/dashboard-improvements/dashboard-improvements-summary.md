---
title: Dashboard Improvements Summary
date: 2026-03-13
---

## Objetivo
Aplicar correções visuais e funcionais na dashboard, com foco em:
- consistência de altura dos bento cards e responsividade;
- correção dos cards **Melhor da Rodada** e **Seu Desempenho** com base no torneio/rodada selecionados;
- ajustes de navbar (notificações, premiações aprovadas, avatar, remoção de itens solicitados);
- favicon com a identidade do projeto;
- validação de lint e build.

## Alterações implementadas

### 1) Dashboard / dados / integrações

#### `src/app/dashboard/page.tsx`
- Adicionada coleta de `avatar_url` do `user_profiles`.
- Adicionada consulta de transações do usuário para somar premiações aprovadas/concluídas (`transactions`, tipo `prize`, status `approved|completed`).
- Adicionada consulta de notificações não lidas (`notifications`, `is_read=false`).
- Passagem de `approvedPrizeTotal` e `unreadNotifications` para `DashboardClient`.
- Remoção de query/estrutura de `stats` legada não utilizada.

#### `src/app/dashboard/dashboard-client.tsx`
- Troca de `UserStatsCard` por `UserStatsCardWithData` (dados reais por torneio/rodada via contexto).
- Ajuste de tipos/props para receber `approvedPrizeTotal`, `unreadNotifications` e `avatarUrl`.
- Passagem das novas props para a `Navbar`.

#### `src/components/bento-grid/index.ts`
- Export de `UserStatsCardWithData` para uso no dashboard.

### 2) Card "Seu Desempenho" (cálculo de acurácia)

#### `src/components/bento-grid/user-stats-card.tsx`
- Implementada função de cálculo:
  - `calculateAccuracyByPoints(totalPredictions, earnedPoints)`
  - regra: **máximo de 5 pontos por palpite**.
- Card passa a calcular acurácia percentual por pontos máximos possíveis:
  - `accuracy = (pontos_obtidos / (palpites * 5)) * 100`
- Aplicado no fluxo por rodada selecionada e no fallback de perfil geral.

### 3) Card "Melhor da Rodada" (integração + visual EAFC)

#### `src/components/bento-grid/best-of-round-card.tsx`
- Correção de cálculo de pontuação por usuário na rodada:
  - usa `points_earned` quando disponível;
  - fallback para `scoringConfig` quando `points_earned` for `null`.
- Mantida integração com torneio e rodada selecionados (`useTournamentContext`).
- Modernização visual com camadas geométricas/gradientes e animações leves em `framer-motion`.
- Exibição explícita da rodada no card e refinamento de responsividade visual.

### 4) Grid e responsividade da dashboard

#### `src/components/bento-grid/bento-grid.tsx`
- Grid ajustado para `auto-rows` responsivos:
  - `min-[480px]:auto-rows-[170px]`
  - `md:auto-rows-[180px]`
  - `lg:auto-rows-[200px]`
- Cards passam a usar `row-span` + `h-full` e `min-h-*` para manter consistência de altura por linha e melhor adaptação entre breakpoints.

### 5) Navbar: notificações, premiação, avatar e limpeza de ações

#### `src/components/layout/navbar.tsx`
- Remoção do botão de alternância tema dark/light.
- Inclusão de botão de notificações com dropdown para não lidas (mobile e desktop).
- No dropdown de usuário:
  - removido item **Estatísticas**;
  - removido item **Pontuação** (admin);
  - adicionada visualização de **premiação aprovada**;
  - adicionada visualização moderna de **avatar** (mobile e desktop).
- Mantida rota de perfil e acesso admin principal.

### 6) Favicon

#### `src/app/layout.tsx`
- Configuração de favicon para usar a logo do projeto:
  - `icon`, `shortcut`, `apple` apontando para `/images/brm-icon.svg`.

## Validações executadas

### Lint
- Comando: `npm run lint`
- Resultado: **sem erros e sem warnings**.

### Build
- Comando: `npm run build`
- Resultado: **build concluído com sucesso**.

### Verificação de navegação (Playwright)
- Navegação inicial realizada com Playwright MCP em `http://localhost:3000`.
- Aplicação carregando corretamente e redirecionando para fluxo de login quando não autenticado (comportamento esperado).

## Observações
- A validação completa de transições internas autenticadas depende de sessão de usuário ativa durante o fluxo E2E.
- Estrutura preparada para futura integração real de leitura/marcação de notificações no dropdown.

## Atualização complementar — refatoração de carrossel (round/tournament)

### 7) Card "Seu Desempenho" redesenhado em carrossel

#### `src/components/bento-grid/user-stats-card.tsx`
- Refatoração completa do card para visual em estilo EAFC (formas geométricas, sem bordas arredondadas, gradientes e brilho animado).
- Implementado carrossel com duas visões:
  - **Rodada** (torneio selecionado + rodada selecionada no `TournamentContext`)
  - **Torneio** (torneio selecionado)
- Navegação por:
  - abas com `Tabs` (HeroUI)
  - botões anterior/próximo
  - troca automática por intervalo
- Dados do usuário integrados no card:
  - nome, avatar, logo do time favorito (badge)
  - pontos, palpites, acertos parciais, acertos exatos, acurácia
- Cálculo de pontos por palpite com fallback para `scoringConfig` quando `points_earned` estiver nulo.

### 8) Card "Melhor da Rodada" redesenhado em carrossel com melhor do torneio

#### `src/components/bento-grid/best-of-round-card.tsx`
- Refatoração completa para snapshots de líder por contexto:
  - **Melhor da rodada**
  - **Melhor do torneio**
- Agregação por usuário com desempate por pontos, exatos, parciais e número de palpites.
- Exibição obrigatória solicitada:
  - pontos em destaque à esquerda
  - à direita: nome, exatos, parciais e palpites
  - avatar e logo do time favorito
- Navegação por abas HeroUI + setas + autoplay.

### 9) Ajuste de integração de valor no card do player (topo direito)

#### `src/app/dashboard/page.tsx`
- Melhorada a origem do valor exibido no player card da navbar:
  - soma de transações do usuário (`type in [prize, bonus, refund]`, `status in [approved, completed]`)
  - fallback para soma de `total_approved` dos prize pools ativos.
- Query do prize pool principal ajustada para buscar apenas `status = active`.

### 10) Validação adicional executada

- `npm run lint` → **sem erros/warnings**.
- `npm run build` → **sucesso**.
- Playwright (MCP):
  - transição entre múltiplas rotas sem loading infinito detectado;
  - verificação de autoplay nos dois carrosséis:
    - visualização inicial em **Rodada**
    - após intervalo, troca automática para **Torneio**.
