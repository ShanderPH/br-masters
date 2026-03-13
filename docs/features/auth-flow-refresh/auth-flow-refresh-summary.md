# Auth Flow Refresh — Login, Registro, Recuperação e Suporte

## Objetivo

Atualizar o fluxo público de autenticação e páginas institucionais para melhorar UX, corrigir navegação, e completar integrações faltantes no frontend e backend.

## Escopo Entregue

### 1) Login

- Integração do `UserSearchInput` com busca via API (`/api/auth/user-search`)
- Login por ID do palpiteiro (firebase_id) e por e-mail mantidos no mesmo layout
- Melhorias de responsividade e overflow no `login-screen`
- Remoção de texto redundante no rodapé
- Cursor pointer aplicado em elementos clicáveis do login

## 2) Registro

- Formulário de cadastro atualizado para os campos:
  - Nome
  - Sobrenome
  - E-mail
  - Time do coração (com logo)
  - WhatsApp
  - CPF opcional
  - Senha / confirmação de senha
  - Avatar opcional
- Validação alinhada com `registerSchema`
- Upload opcional de avatar com limite de 2MB
- Novo endpoint server-side para concluir perfil:
  - `POST /api/auth/register-profile`
  - Persiste em `users` e `user_profiles`
  - Retorna `firebaseId` para ser exibido na tela de sucesso
- Tela de sucesso exibe o ID do palpiteiro antes do redirecionamento

## 3) Recuperação de Senha

- Nova rota pública: `/redefinir-senha`
- Página de recuperação com dois modos:
  - Solicitar link por e-mail
  - Definir nova senha quando em contexto de recovery
- Integração com Supabase Auth:
  - `resetPasswordForEmail`
  - `updateUser({ password })`

## 4) Suporte e About

- Página `/support` conectada ao backend
- Novo endpoint:
  - `POST /api/support/contact`
  - Validação com Zod
  - Envio via Resend API
  - Destino padrão: `felipe.braat@outlook.com`
- Ajustes de cursor pointer em links/ações de `/support` e `/about`

## 5) Rotas e Acesso Público

- Atualização de rotas públicas no proxy:
  - `/login`
  - `/register`
  - `/redefinir-senha`
  - `/about`
  - `/support`
- Ajuste para não tratar `/redefinir-senha` como rota de auth redirect obrigatório quando já autenticado

## 6) Qualidade e Build

- Lint executado com sucesso (sem erros)
- Build de produção executado com sucesso
- Warnings de `<img>` no checkout resolvidos com `next/image`

## Variáveis de ambiente adicionadas/documentadas

No `.env.example`:

- `RESEND_API_KEY`
- `SUPPORT_FROM_EMAIL`
- `SUPPORT_TO_EMAIL`

## Arquivos principais afetados

- `src/components/auth/login-screen.tsx`
- `src/components/auth/user-search-input.tsx`
- `src/app/api/auth/user-search/route.ts`
- `src/app/register/page.tsx`
- `src/app/api/auth/register-profile/route.ts`
- `src/app/redefinir-senha/page.tsx`
- `src/app/support/page.tsx`
- `src/app/api/support/contact/route.ts`
- `src/app/about/page.tsx`
- `src/proxy.ts`
- `src/lib/routes.ts`
- `.env.example`

## Observações técnicas

- O endpoint `register-profile` usa upsert via PostgREST REST API com service role para contornar incompatibilidade de tipagem inferida em `upsert` no client TypeScript atual.
- O envio de e-mail de suporte depende das variáveis de ambiente do Resend estarem configuradas em ambiente de execução.
