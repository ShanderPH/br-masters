# BR Masters - Palpites de Futebol

O melhor jogo de palpites de futebol do Brasil. Faça suas previsões, escale o ranking e prove que você é um verdadeiro mestre!

> **Status:** Em desenvolvimento ativo

---

## Sumario

- [Sobre o Projeto](#sobre-o-projeto)
- [Tech Stack](#tech-stack)
- [Pre-requisitos](#pre-requisitos)
- [Instalacao e Configuracao](#instalacao-e-configuracao)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Paginas e Rotas](#paginas-e-rotas)
- [Design System](#design-system)
- [Autenticacao](#autenticacao)
- [Sistema de Pontuacao](#sistema-de-pontuacao)
- [Integracao com Supabase](#integracao-com-supabase)
- [API Externa (SofaScore)](#api-externa-sofascore)
- [Contribuicao](#contribuicao)
- [Seguranca](#seguranca)
- [Licenca](#licenca)

---

## Sobre o Projeto

BR Masters e uma plataforma web de palpites de futebol brasileiro. Os usuarios fazem previsoes de placares de partidas do Brasileirao e outros campeonatos, competem em rankings e acompanham estatisticas em tempo real.

**Principais funcionalidades:**

- Login com sistema de IDs numericos + senha
- Dashboard interativo com Bento Grid layout
- Palpites de partidas com modal de previsao
- Rankings gerais e por campeonato com podio visual
- Sistema de XP e niveis (Novato a Lenda)
- Bolao com premiacao
- Temas claro/escuro (inspirado no FIFA/EA FC)
- Design responsivo (mobile-first)

---

## Tech Stack

| Categoria | Tecnologia | Versao |
|-----------|-----------|--------|
| **Framework** | Next.js (App Router) | 16.1.5 |
| **Linguagem** | TypeScript | 5.x |
| **UI Library** | HeroUI | V3 (Beta) |
| **Styling** | Tailwind CSS | V4 |
| **Animacoes** | Framer Motion | 12.x |
| **Icones** | Lucide React | - |
| **Temas** | next-themes | - |
| **Auth & DB** | Supabase | SSR |
| **API Externa** | SofaScore (RapidAPI) | - |

---

## Pre-requisitos

- **Node.js** >= 18.18.0
- **npm** >= 9.0.0 (ou yarn/pnpm)
- **Conta Supabase** com projeto configurado
- **Chave RapidAPI** (opcional - o app usa dados mock sem ela)

---

## Instalacao e Configuracao

### 1. Clonar o repositorio

```bash
git clone https://github.com/seu-usuario/br-masters.git
cd br-masters
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variaveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```bash
# Obrigatorio - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

# Opcional - SofaScore API (sem ela, usa dados mock)
RAPIDAPI_KEY=sua_chave_rapidapi
```

> **IMPORTANTE:** Nunca commite o arquivo `.env.local`. Ele ja esta no `.gitignore`.

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Desenvolvimento Local

### Scripts disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de producao |
| `npm start` | Servidor de producao |
| `npm run lint` | Verificacao de lint (ESLint) |

### Fluxo de trabalho

1. Crie uma branch a partir de `main`: `git checkout -b feat/minha-feature`
2. Faca suas alteracoes
3. Verifique lint: `npm run lint`
4. Verifique build: `npm run build`
5. Commite seguindo Conventional Commits: `git commit -m "feat: descricao"`
6. Abra um Pull Request

---

## Estrutura do Projeto

```
br-masters/
├── public/
│   ├── fonts/Barlow/              # Fonte Barlow (variantes)
│   └── images/
│       ├── logo/                  # Logos de times (SVG)
│       ├── brmasters.svg          # Logo principal
│       └── brm-icon.svg           # Icone/favicon
├── src/
│   ├── app/
│   │   ├── globals.css            # Design System + Tailwind
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Pagina inicial (redirect)
│   │   ├── providers.tsx          # ThemeProvider
│   │   ├── api/
│   │   │   ├── sofascore/         # API proxy para SofaScore
│   │   │   └── team-logo/         # Servir logos dinamicamente
│   │   ├── dashboard/             # Dashboard (server + client)
│   │   ├── login/                 # Pagina de login
│   │   ├── partidas/              # Partidas e palpites
│   │   ├── ranking/               # Rankings por campeonato
│   │   └── tests/                 # Showcase do Design System
│   ├── components/
│   │   ├── auth/                  # LoginScreen, UserSearchInput
│   │   ├── bento-grid/            # Tiles do dashboard
│   │   ├── dashboard/             # Background animado
│   │   ├── layout/                # Navbar responsiva
│   │   ├── matches/               # MatchCard, PredictionModal
│   │   └── ui/                    # BRMLogo, PageLoading, etc.
│   ├── hooks/
│   │   └── use-auth.ts            # Hook de autenticacao
│   └── lib/
│       ├── auth/                  # Servico de autenticacao
│       ├── services/              # XP, niveis
│       └── supabase/              # Clientes (browser/server/middleware)
├── .env.example                   # Template de variaveis de ambiente
├── src/proxy.ts                   # Proxy/Middleware de autenticacao (Next.js 16)
├── next.config.ts                 # Configuracao Next.js
├── tsconfig.json                  # Configuracao TypeScript
├── eslint.config.mjs              # Configuracao ESLint
└── package.json
```

---

## Paginas e Rotas

| Rota | Descricao | Requer Auth |
|------|-----------|:-----------:|
| `/` | Redirect para `/dashboard` ou `/login` | - |
| `/login` | Tela de login | Nao |
| `/dashboard` | Dashboard Bento Grid | Sim |
| `/partidas` | Lista de partidas + palpites | Sim |
| `/ranking` | Ranking geral e por campeonato | Sim |
| `/tests` | Showcase do Design System | Nao |

---

## Design System

### Paleta de Cores (FIFA/EA FC Inspired)

| Token | Valor | Uso |
|-------|-------|-----|
| `brm-background` | `#1A1A2E` | Fundo principal (dark) |
| `brm-card` | `#2C2C4E` | Cards elevados |
| `brm-primary` | `#25B8B8` | Turquoise - Acoes primarias |
| `brm-secondary` | `#CCFF00` | Electric Lime - Destaques |
| `brm-accent` | `#D63384` | Magenta - Acentos visuais |
| `brm-purple` | `#4B3B7F` | Elementos secundarios |

### Animacoes

| Classe | Efeito |
|--------|--------|
| `animate-float` | Flutuacao suave |
| `animate-glow-pulse` | Pulso com brilho |
| `animate-shimmer` | Efeito shimmer |
| `animate-bounce-in` | Entrada com bounce |
| `animate-sparkle` | Efeito sparkle |

### Classes Utilitarias

| Classe | Descricao |
|--------|-----------|
| `.glass` | Efeito glassmorphism |
| `.geometric-card` | Card com efeito geometrico |
| `.gradient-border` | Borda com gradiente animado |
| `.skew-card` | Card com skew (estilo EA FC) |
| `.glow-hover` | Glow no hover |
| `.diagonal-stripes` | Padrao de listras diagonais |

### Temas

O projeto suporta temas claro e escuro com transicao suave via `next-themes`. O tema escuro e o padrao, inspirado no visual do FIFA/EA FC Ultimate Team.

---

## Autenticacao

O sistema utiliza **Supabase Auth** com compatibilidade ao sistema legado:

- Login via ID numerico (ex: `001`) + senha
- Sessoes persistentes com auto-refresh via cookies
- Protecao de rotas via `src/proxy.ts` (Next.js 16 Proxy/Middleware)
- Hook `useAuth` para gerenciamento de estado no client

### Fluxo de autenticacao

1. Usuario seleciona seu perfil via busca
2. Insere a senha numerica
3. O sistema autentica via Supabase Auth (`signInWithPassword`)
4. Sessao e armazenada em cookies HTTP-only
5. O proxy redireciona rotas protegidas conforme estado da sessao

---

## Sistema de Pontuacao

| Resultado | Pontos |
|-----------|--------|
| Placar exato | 5 pts |
| Acerto do vencedor/empate | 2 pts |
| Erro | 0 pts |

### Rankings

- **Ranking Geral** - soma de pontos de todos os campeonatos
- **Ranking por Campeonato** - pontos especificos por torneio
- **Sistema de XP e Niveis** - de Novato (LVL 1) a Lenda (LVL 10+)

---

## Integracao com Supabase

### Tabelas utilizadas

| Tabela | Descricao |
|--------|-----------|
| `users_profiles` | Perfis de usuarios (nome, pontos, XP, time favorito) |
| `matches` | Partidas com placares e status |
| `predictions` | Palpites dos usuarios |
| `user_tournament_points` | Pontos por campeonato |
| `prize_pool` | Bolao e premiacao |
| `teams` | Times cadastrados |
| `current_round` | Rodada atual ativa |

### Clientes Supabase

- **Browser** (`lib/supabase/client.ts`) - Singleton para componentes client
- **Server** (`lib/supabase/server.ts`) - Para Server Components e API Routes
- **Middleware** (`lib/supabase/middleware.ts`) - Para o proxy de autenticacao

---

## API Externa (SofaScore)

A API do SofaScore (via RapidAPI) e usada para buscar classificacoes de campeonatos.

- **Endpoint:** `/api/sofascore/standings`
- **Cache:** In-memory com TTL de 5 minutos
- **Fallback:** Dados mock quando `RAPIDAPI_KEY` nao esta configurada

Para usar dados reais, obtenha uma chave em [RapidAPI - SofaScore](https://rapidapi.com/sofascore/api/sofascore).

---

## Contribuicao

### Branches

- `main` - Branch principal, sempre estavel
- `feat/*` - Novas funcionalidades
- `fix/*` - Correcoes de bugs
- `chore/*` - Tarefas de manutencao
- `refactor/*` - Refatoracoes

### Commits

Seguimos o padrao [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar filtro de campeonato no ranking
fix: corrigir redirect apos login
chore: atualizar dependencias
refactor: extrair logica de autenticacao para hook
docs: atualizar README com instrucoes de deploy
```

### Pull Requests

1. Descreva claramente o que foi alterado
2. Referencie issues relacionadas
3. Garanta que lint e build passam sem erros
4. Solicite review de pelo menos 1 pessoa

---

## Seguranca

- **Nunca** commite arquivos `.env.local` ou qualquer arquivo com credenciais
- Variaveis sensíveis devem ser documentadas apenas em `.env.example` com placeholders
- Variaveis `NEXT_PUBLIC_*` sao expostas ao client - use apenas chaves anonimas (anon key)
- Chaves de servico (`SUPABASE_SERVICE_ROLE_KEY`) devem ser usadas **apenas server-side**
- O `.gitignore` esta configurado para ignorar todos os arquivos `.env.*` exceto `.env.example`
- Reporte vulnerabilidades via issue privada ou contato direto com os mantenedores

---

## Licenca

MIT &copy; BR Masters 2025
