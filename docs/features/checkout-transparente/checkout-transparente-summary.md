# Checkout Transparente - BR Masters

## Overview
Custom checkout page fully integrated with Mercado Pago's Checkout Transparente (API), allowing payments via **Credit Card** and **PIX** without redirecting to external sites. The UI follows the EA FC design system with dark theme, skewed elements, and the project's color palette.

## Architecture

### Payment Flow
```
Dashboard → /checkout → Select Category → Set Amount → Choose Method → Payment Details → Confirmation
                                                         ├── Card: Tokenize via MercadoPago.js → POST /api/payments/process → Instant result
                                                         └── PIX: POST /api/payments/process → QR Code + Timer → Poll /api/payments/status/[id]
```

### Webhook Flow (Background)
```
Mercado Pago → POST /api/payments/webhook → Parse body/query → Verify signature → Fetch payment from MP API → Update transaction → Create notification
```

## Files Created

### Frontend Components
| File | Description |
|------|-------------|
| `src/app/checkout/page.tsx` | Server component - auth check, fetch profile, render client |
| `src/app/checkout/checkout-client.tsx` | Main checkout client - 5-step flow with all payment logic |
| `src/components/checkout/checkout-stepper.tsx` | Animated step progress indicator |
| `src/components/checkout/payment-timer.tsx` | Circular countdown timer with progress animation |
| `src/components/dashboard/prize-pool-visualization.tsx` | Prize pool cards per category (tournament/round/match) |
| `src/hooks/use-mercadopago.ts` | Hook to load MercadoPago.js SDK and expose tokenization methods |

### Backend API Routes
| File | Description |
|------|-------------|
| `src/app/api/payments/process/route.ts` | Process card and PIX payments directly via MP API |
| `src/app/api/payments/status/[id]/route.ts` | Poll transaction status (used by PIX timer) |
| `src/app/api/payments/webhook/route.ts` | Bulletproof webhook handler - always returns 200 |

### Service Layer
| File | Description |
|------|-------------|
| `src/lib/services/mercadopago.ts` | Updated with `createCardPayment()` and `createPixPayment()` functions |

## Files Modified

| File | Change |
|------|--------|
| `src/app/dashboard/dashboard-client.tsx` | Replaced DepositModal with router.push("/checkout"), added PrizePoolVisualization |
| `.env.local` / `.env.example` | Added `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` |

## Production Environment Requirements

### Critical Environment Variables
The following environment variables **MUST** be set correctly in production:

```bash
# REQUIRED: Must be the production HTTPS URL
NEXT_PUBLIC_APP_URL=https://brmasters.febrate.com

# REQUIRED: Mercado Pago credentials
MERCADOPAGO_ACCESS_TOKEN=<your_production_access_token>
MERCADOPAGO_PUBLIC_KEY=<your_public_key>
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<your_public_key>
MERCADOPAGO_WEBHOOK_SECRET=<from_mp_webhook_settings>

# REQUIRED: Supabase service role for webhook writes
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### Webhook Configuration
The webhook URL must be configured in Mercado Pago dashboard:
- **Production URL:** `https://brmasters.febrate.com/api/payments/webhook`
- **Topics:** `payment` (minimum required)

### Local Development Notes
- `notification_url` is automatically **skipped** for localhost URLs (MP rejects non-HTTPS URLs)
- For local testing, payments will work but webhook notifications won't be received
- Use the `/api/payments/status/[id]` polling endpoint to check payment status locally

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `notification_url attribute must be url valid` | Using localhost URL | Set `NEXT_PUBLIC_APP_URL` to production HTTPS URL |
| `Unauthorized use of live credentials` | Production token with test email | Use real email addresses or switch to sandbox credentials |
| `502 webhook errors` | Server not responding | Check `SUPABASE_SERVICE_ROLE_KEY` and `MERCADOPAGO_ACCESS_TOKEN` are set |

## Database Changes

### Migration: `add_prize_pool_category_and_aggregation_view`
- Added `category` column to `prize_pools` (tournament_prize / round_prize / match_prize)
- Added `round_number` and `match_id` columns to `prize_pools`
- Created `prize_pool_summary` view (aggregates deposits by category)
- Created `update_prize_pool_on_deposit()` trigger function (auto-updates prize pools when deposits are approved)
- Added RLS policies: public SELECT, service_role full access

## Checkout Steps

1. **Categoria** - Select prize category (Tournament / Round / Match)
2. **Valor** - Set deposit amount (R$ 5 - R$ 5.000) with quick-select buttons
3. **Pagamento** - Choose payment method (PIX recommended, or Credit Card)
4. **Dados** - Enter payment details:
   - **Card**: Card number (with BIN detection + brand logo), cardholder name, expiry, CVV, CPF, installments
   - **PIX**: Optional CPF, then generate QR code
5. **Status** - Payment confirmation:
   - **Card**: Instant approved/rejected/pending
   - **PIX**: QR code display + copy-paste code + 30-min countdown timer with circular progress

## Key Technical Decisions

### Webhook 502 Fix
- **Root cause**: `request.json()` could throw on malformed body; `createServiceClient()` could crash without env vars
- **Fix**: Dynamic `import("mercadopago")` inside handler, double try-catch (body parse + processing), always return 200 to stop MP retries
- Also handles query params (`data.id`, `type`) as fallback for IPN-style notifications
- Signature verification attempts both lowercase and original case for `data.id`

### MercadoPago.js Integration
- Script loaded dynamically via `<script>` tag (not npm package)
- Hook manages SDK lifecycle with cleanup
- Card tokenization happens client-side (PCI compliant)
- BIN detection auto-detects card brand and fetches installment options

### PIX Payment Polling
- Frontend polls `/api/payments/status/[id]` every 5 seconds
- Timer component shows 30-minute countdown with circular SVG progress
- Color changes to urgent (magenta) when < 2 minutes remain
- Auto-stops polling on confirmation/expiration

### Prize Pool Auto-Aggregation
- DB trigger `trg_update_prize_pool` fires on transaction INSERT/UPDATE
- Automatically creates/updates prize_pools record per category
- Links transaction to prize_pool via `prize_pool_id`

## Environment Variables Required

```env
# Server-side
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=<from MP panel>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase>

# Client-side
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
NEXT_PUBLIC_APP_URL=https://brmasters.febrate.com
```

## Testing Checklist
- [ ] Card payment flow (approved/rejected)
- [ ] PIX payment flow (generate QR, confirm via webhook)
- [ ] Timer countdown and expiration
- [ ] Webhook receives and processes notifications
- [ ] Prize pool auto-aggregation on approval
- [ ] Prize pool visualization appears on dashboard
- [ ] Responsive layout on mobile
