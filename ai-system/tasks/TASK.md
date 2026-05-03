# TASK: Restore bets from a restored deleted match

## CONTEXT
BR Masters is a football prediction platform using Next.js + Supabase.

## OBJECTIVE
Recover predictions that were lost after a match was accidentally deleted via the admin panel for the game between Atlético Paranaense and Grêmio on May 2, 2026, in the 2026 Brazilian Serie A Championship (ID: 325, season ID 87678, round 14).

## REQUIREMENTS
- Restore predictions
- Keep bets linked to the rescheduled match

## CONSTRAINTS
- must use Supabase
- use Supabase mcp to analyse de codebase
- Don't change other matches

## FILES TO ANALYZE
- 