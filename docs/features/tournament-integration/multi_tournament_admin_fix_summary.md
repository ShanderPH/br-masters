# Correção de Importação de Torneios e Ajustes Multi-Torneio

## Contexto

Foi identificada falha na tela de gestão de torneios (`/admin/tournaments`) ao executar a configuração de torneio via SofaScore, retornando o erro:

```json
{"error":"Ação desconhecida"}
```

O problema impactava o fluxo de configuração/importação para novos torneios (ex.: `tournamentId=384`, `seasonId=87760`) e comprometia a operação multi-torneio da plataforma.

---

## Causa raiz

A action `setup_tournament` era disparada pelo frontend administrativo, porém não estava implementada no backend em `POST /api/admin/sofascore`.

Além disso, havia inconsistências no envio de IDs do SofaScore nas ações de importação em `admin/tournaments`.

---

## Arquivos alterados

### 1) `src/app/api/admin/sofascore/route.ts`

- Adicionado suporte à action `setup_tournament`.
- Implementada detecção de formato de torneio (`league`, `knockout`, `mixed`) com base em rounds + standings.
- Fluxo completo de criação/atualização de:
  - `tournaments` por `sofascore_id`
  - `tournament_seasons` por `tournament_id + sofascore_season_id`
- Atualização de `is_current` para manter somente uma temporada atual por torneio.
- Retorno completo para o frontend com `tournament`, `seasons`, `rounds`, `currentRound`, `detectedFormat`.
- Ajustado uso de `createServiceClient()` (quando disponível) para operações administrativas de escrita.

### 2) `src/app/admin/tournaments/page.tsx`

- Ajustados `select` para incluir `sofascore_id` e `sofascore_season_id`.
- Corrigidas ações de importação para sempre enviar:
  - `sofascoreTournamentId`
  - `sofascoreSeasonId`
- Ajuste de seleção de temporada corrente (`is_current`) nas ações:
  - Importar Partidas
  - Importar Times
  - Atualizar Placares
- Corrigido tipo de resposta esperado de `import_matches` para o payload real da API (`total`, `upserted`, `teamsProcessed`, `errors`, `roundNumbers`).

### 3) `src/app/admin/matches/page.tsx`

- Padronização de status para modelo atual:
  - `scheduled`
  - `live`
  - `finished`
- Mantida compatibilidade com status legados (`notstarted`, `inprogress`) para leitura/renderização.
- Ajustes de filtro e edição para evitar divergência entre painel e dados importados.

### 4) `src/app/admin/predictions/page.tsx`

- Melhorado filtro multi-torneio/multi-rodada no backend:
  - Busca prévia de `matches` por `tournament_id`/`round_number`
  - Aplicação de filtro `match_id IN (...)` na consulta de palpites
- Inclusão de `roundFilter` nas dependências de carregamento para comportamento reativo correto.

### 5) `src/components/dashboard/tournament-context.tsx`

- Cálculo automático de rodada passou a considerar a temporada atual (`season_id`) de cada torneio.
- Evita mistura de partidas de temporadas diferentes no mesmo torneio.
- Adicionado fallback para torneios sem `round_number` (ex.: formatos mata-mata), usando `current_round_number` da temporada.

### 6) `src/app/api/sofascore/standings/route.ts`

- Suporte a múltiplos grupos de classificação retornados pela API do SofaScore.
- Enriquecimento de standings com `groupName` quando disponível.
- Resolução de temporada ajustada para considerar `tournament_id + sofascore_season_id`, evitando colisão entre torneios com mesmo `sofascoreSeasonId`.

---

## Resultado esperado

- A configuração de torneios via `/admin/tournaments` deixa de retornar `Ação desconhecida`.
- Fluxo de importação para novos torneios (incluindo Libertadores `384/87760`) passa a funcionar com payload correto.
- Painéis de partidas e palpites ficam mais confiáveis no contexto multi-torneio/multi-temporada.
- Cards/dashboard e endpoints associados passam a respeitar melhor o contexto da temporada ativa por torneio.

---

## Observação operacional

As correções de código precisam ser publicadas no ambiente de produção para que o erro atual observado em `https://brmasters.febrate.com/admin/tournaments` seja efetivamente eliminado.
