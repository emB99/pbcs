# PBCS — Premium Baking and Culinary School admin tool

Internal admin tool for office staff: who's enrolled, what they agreed to pay, what they've paid, what they owe. See [PBCS-HANDOFF.md](./PBCS-HANDOFF.md) for the full spec this was built from.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · Zod

## Setup

1. **Create a Supabase project** (dashboard.supabase.com), under the client's own account/billing, not the developer's.
2. Copy `.env.example` to `.env.local` and fill in the three values from Project Settings → API:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
3. Apply the schema — from `supabase/migrations/`, in order, either:
   - `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
   - paste each file into the Supabase SQL editor in order.
4. Load the course catalogue: run `supabase/seed.sql` in the SQL editor.
5. Regenerate types after any schema change:
   ```bash
   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
   ```
6. Create the first staff login: Supabase dashboard → Authentication → Add user (email + password). There's no public sign-up screen by design — every user is office staff.
7. `npm install && npm run dev`

## Verifying the append-only ledger

In the SQL editor, after inserting a test charge:

```sql
update transactions set amount = 1 where true;
```

should raise `transactions are append-only; insert a reversal instead`. Same for `delete from transactions;`.

## Deploying

Vercel, under the client's own account. Set the same three env vars there. No other services required — no payment gateway, no email/SMS sending, no external rate API.

## Open questions for the client

Carried over from the handoff doc — these change scope if answered a certain way:

1. Does PBCS hold its own HEXCO examination centre number, or do candidates sit elsewhere?
2. What is the actual withdrawal/refund policy? Currently modelled as an explicit choice (write off vs. keep owing) at withdrawal time.
3. Do they issue fiscal tax invoices? ZIMRA fiscalisation is out of scope for this build.
4. Are fees ever quoted in ZWG rather than just paid in ZWG? Current model assumes USD quotation with ZWG payment conversion.
5. Is there existing data to migrate from a spreadsheet? Assumed no — a one-off import script would be additional scope.
