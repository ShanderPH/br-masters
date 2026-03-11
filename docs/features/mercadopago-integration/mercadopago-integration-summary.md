# Mercado Pago Integration - BR Masters

## Overview
Full Mercado Pago Checkout Pro integration for processing deposits in the BR Masters football prediction game.

## Architecture

### Backend (Server-side)

#### 1. Mercado Pago Service (`src/lib/services/mercadopago.ts`)
- Initializes `MercadoPagoConfig` with server-side `MERCADOPAGO_ACCESS_TOKEN`
- Exports `preferenceClient` and `paymentClient` singletons
- `createDepositPreference()` - Creates a Checkout Pro preference with:
  - Item details (category label, amount)
  - Payer info (email, name from user_profiles)
  - Back URLs (success/failure/pending → /dashboard with query params)
  - Webhook notification URL (`/api/payments/webhook`)
  - 30-minute expiration
  - Statement descriptor "BR MASTERS"
  - Metadata with user_id, transaction_id, category
- `getPaymentById()` - Fetches payment details for webhook processing

#### 2. Create Preference API (`src/app/api/payments/create-preference/route.ts`)
- **POST** endpoint for authenticated users
- Validates amount (R$ 5.00 – R$ 5,000.00)
- Validates category (tournament_prize, round_prize, match_prize)
- Creates a `transactions` record (status: pending, type: deposit)
- Creates Mercado Pago preference via SDK
- Returns `preferenceId`, `initPoint`, `sandboxInitPoint`, `transactionId`

#### 3. Webhook API (`src/app/api/payments/webhook/route.ts`)
- **POST** endpoint for Mercado Pago webhook notifications
- **GET** endpoint for health check
- Verifies webhook signature via HMAC-SHA256 (`x-signature` header)
- Maps MP payment status → transaction status:
  - `approved` → `approved`
  - `pending`/`in_process`/`authorized` → `pending`
  - `rejected`/`cancelled` → `rejected`
  - `refunded`/`charged_back` → `cancelled`
- Updates transaction with MP metadata (payment_id, status_detail, payment_type, date_approved)
- On approval: creates points_history entry + success notification
- On rejection: creates failure notification
- Idempotent: skips already-approved transactions

### Frontend (Client-side)

#### 4. Deposit Modal (`src/components/payments/deposit-modal.tsx`)
- Multi-step modal following EA FC design system:
  - **Step 1 (select)**: Choose prize category (Tournament/Round/Match)
  - **Step 2 (amount)**: Set deposit amount with +/- controls and presets
  - **Step 3 (processing)**: Loading spinner animation
  - **Step 4 (success)**: Redirect progress bar → opens Mercado Pago in new tab
  - **Step 5 (error)**: Error display with retry option
- Design system compliance:
  - `skew-card` parallelogram elements
  - `diagonal-stripes` pattern overlay
  - Gradient backgrounds using project color palette
  - `font-display` (Barlow) typography
  - No border-radius (sharp geometric edges)
  - framer-motion animations (staggered entry, scale, slide)
- Mobile-first responsive design
- HeroUI v3 Modal compound pattern + Button components

#### 5. Dashboard Integration (`src/app/dashboard/dashboard-client.tsx`)
- `handleDeposit` opens `DepositModal` instead of navigation
- PrizePoolCard "Participar" button triggers the deposit flow

## Payment Categories

| Category | Label | Description |
|---|---|---|
| `tournament_prize` | Premiação por Torneio | Full tournament prize pool deposit |
| `round_prize` | Premiação por Rodada | Per-round prize pool deposit |
| `match_prize` | Premiação por Partida | Per-match prize pool deposit |

## Environment Variables

| Variable | Description | Server-only |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | MP API access token | Yes |
| `MERCADOPAGO_PUBLIC_KEY` | MP public key (for frontend SDK if needed) | No |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook signature secret | Yes |
| `NEXT_PUBLIC_APP_URL` | App base URL for callbacks | No |

## Security Measures

1. **Webhook signature verification** via HMAC-SHA256 with `x-signature` header
2. **Server-side only** access token (never exposed to client)
3. **Auth-required** preference creation endpoint
4. **Service role client** for DB writes (bypasses RLS safely)
5. **Idempotent webhook processing** (prevents double-credit)
6. **Amount validation** (R$ 5.00 min, R$ 5,000.00 max)
7. **30-minute preference expiration**
8. **Audit trail** via transaction metadata (MP payment_id, status history)

## Database Flow

```
User clicks "Participar" → DepositModal opens
  → Selects category → Sets amount → Clicks "Depositar"
    → POST /api/payments/create-preference
      → INSERT transactions (status: pending)
      → Create MP preference
      → Return init_point URL
    → Redirect to Mercado Pago
      → User completes payment
        → MP sends webhook POST /api/payments/webhook
          → Verify signature
          → UPDATE transactions (status: approved)
          → INSERT notifications (deposit confirmed)
          → INSERT points_history (deposit record)
```

## Files Created/Modified

### New Files
- `src/lib/services/mercadopago.ts` - MP SDK wrapper
- `src/app/api/payments/create-preference/route.ts` - Preference creation API
- `src/app/api/payments/webhook/route.ts` - Webhook handler
- `src/components/payments/deposit-modal.tsx` - Deposit UI modal

### Modified Files
- `.env.example` - Added MP env vars documentation
- `.env.local` - Added MP env vars (placeholder values)
- `src/app/dashboard/dashboard-client.tsx` - Integrated DepositModal

## Testing Checklist

- [ ] Configure real `MERCADOPAGO_ACCESS_TOKEN` from MP developer panel
- [ ] Configure `MERCADOPAGO_WEBHOOK_SECRET` from MP webhook settings
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Create MP test users for sandbox testing
- [ ] Test deposit flow end-to-end in sandbox mode
- [ ] Verify webhook receives notifications (use MP webhook simulator)
- [ ] Test all 3 payment categories
- [ ] Test min/max amount validation
- [ ] Test unauthenticated access rejection
- [ ] Verify transaction status updates correctly
- [ ] Verify notifications are created on approval/rejection
