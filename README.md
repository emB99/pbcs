# School Admin

School administration for colleges and primary/secondary schools: students, courses/classes, teachers, enrolments and fees. One deployment serves one school; the first person to sign in completes `/setup`, becomes the owner, and invites everyone else from Settings → Team. The original spec this grew from is in [PBCS-HANDOFF.md](./PBCS-HANDOFF.md).

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
6. In the Supabase dashboard: Authentication → Sign In / Providers → turn **off** "Allow new users to sign up" once the owner exists (the app has no public sign-up; staff are invited from Settings → Team). Then, in Authentication → Email Templates, set the **Invite user** and **Reset password** links to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (and `type=recovery` for reset), so the app can verify them server-side.
7. Create the first login: Authentication → Add user (email + password), or sign in with Google while sign-ups are still enabled. Open `/setup` to name the school, choose its type and become the owner.
8. `npm install && npm run dev`

## Currency and region

Each school chooses its **base currency** (balances are kept and reported in it), any **other currencies** it accepts, how numbers and dates are written (locale), its **timezone** and its **payment methods**. Choose the currency at first-run setup: it can only be changed until the first transaction is recorded. Everything else lives in Settings → Region & money. Payments in another currency record an exchange rate into the base currency, so every balance stays in one currency.

## Receipts and invoices

Every payment gets a numbered receipt and every charge a numbered invoice (for example `RCT-00012` and `INV-00031`). Numbers are stamped by the database as the row is recorded, count up with no gaps, and cannot be chosen by a client. Adjustments and reversals are not numbered; reversing a payment or charge marks its receipt or invoice VOID. Prefixes and a footer for bank details or terms are set in Settings → School. Open a document from the student ledger, the Payments list, or the "View receipt" button after recording a payment, then use the browser's print dialog (or "Save as PDF").

## Demo data (optional)

To explore the app with a populated school, run these in the Supabase SQL editor, in order, on a database that has no school yet:

1. `supabase/seed-demo.sql`: a small college with students, courses, subjects, intakes, enrolments and payments.
2. `supabase/seed-demo-grades.sql`: Semester 1 marks (locked) and report card comments.
3. `supabase/seed-demo-timetable.sql`: rooms and a weekly timetable.

Each script does nothing if its data is already there. They do not create a login: sign in, then claim the school at `/setup`, or add an owner membership yourself.

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
