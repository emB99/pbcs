# PBCS School Management System — Build Handoff

**Client:** Premium Baking and Culinary School, Harare
**Stack:** Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth) · Vercel
**Audience for this doc:** Claude Code, starting from an empty repo.

---

## 1. What this is

A small internal admin tool for a private culinary training school. One or two office staff use it to answer: **who is enrolled, what did they agree to pay, what have they paid, what do they owe.**

It is not a school platform. There is no student login, no parent portal, no public-facing surface. Every user is a staff member sitting at the office desktop or on a phone.

### Scale it must handle

Roughly **40–80 active students**, 4–6 concurrent intakes, maybe 30 payments a month. Design for legibility at that size, not for aggregation. No charts. No trend lines. No percentage-change indicators. With 47 students a donut chart is noise.

### The client's two business lines

These share a data model but behave differently, and the UI must not assume one:

| | Short courses | HEXCO programmes |
|---|---|---|
| Examples | Basic Baking, Birthday Cakes, Wedding Cakes, Snacks Cookery | Professional Cookery (NC), Hospitality Management (NC), Food & Beverages (NFC) |
| Length | Days to weeks | Months |
| Fee | One payment, sometimes two | Deposit + instalments over the programme |
| Volume | Higher, more churn | Lower, longer-lived balances |

### Explicitly out of scope

Do not build these, do not scaffold them, do not leave TODOs for them:

- Attendance registers
- Grades, marks, assessment
- Timetabling / kitchen scheduling
- Stock and ingredient tracking
- Payroll
- Parent or student access
- HEXCO exam entry and results submission
- Payment gateway integration
- SMS or email sending
- Multi-tenancy
- A permissions matrix or approval workflows

Some of these may become phase two. None of them are phase one.

### Why the scope is this tight

The client is a small, early-stage operation. The developer is building this as a bounded engagement with minimal ongoing support. **Every feature is a future support call.** When in doubt, cut.

---

## 2. The one architectural rule

**Fees are an append-only ledger. There is no balance column anywhere.**

Every financial fact is a row in `transactions`. Rows are never updated and never deleted. A balance is always `SUM(amount)`.

Corrections happen by inserting a **reversal**: a new row with the opposite amount, linked to the row it reverses, with a reason. The original stays visible.

This is non-negotiable and the database enforces it (trigger in §4). The reason: the moment a bursar finds a number she can't explain, she stops trusting the system and goes back to Excel. An immutable ledger means every figure on screen can be drilled to the rows that produced it.

**Corollary for the UI:** every mistake must be fixable by the user, in the interface, without calling the developer. If you're building a screen and think "they'd never enter that wrong" — build the fix anyway.

---

## 3. Money and currency

Zimbabwe runs dual currency. Most fees are quoted and paid in **USD**; some payments arrive in **ZWG**.

Rules:

- Every transaction stores the **original amount and currency** as entered, plus the **rate applied** and the **derived USD amount**.
- The USD amount is a generated column. Never computed in application code.
- All balances, totals and reporting are in **USD**.
- Rate is entered manually per transaction, defaulting to the last rate used. Do not fetch rates from an API — it's an integration that will break and generate a support call.
- For USD transactions the rate is `1`.

Use `numeric(12,2)` for money and `numeric(14,4)` for rates. Never floats. In TypeScript, handle money as strings at the boundary and format for display; do not do arithmetic on money in JS — let Postgres sum.

---

## 4. Data model

Six tables. Write as Supabase migrations.

```sql
-- ============ students ============
create table students (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text not null,              -- primary identifier in practice
  email         text,                       -- often blank
  national_id   text,
  address       text,
  notes         text,
  created_at    timestamptz not null default now(),
  archived_at   timestamptz                 -- soft delete only
);
create index on students (lower(full_name));
create index on students (phone);

-- ============ instructors ============
-- Deliberately minimal. The client has a handful of chefs.
create table instructors (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

-- ============ courses ============
create type course_kind as enum ('short_course', 'programme');

create table courses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          course_kind not null,
  default_price numeric(12,2) not null default 0,   -- a DEFAULT, always overridable
  default_weeks int,
  description   text,
  created_at    timestamptz not null default now(),
  archived_at   timestamptz
);
```

> **No hard-coded course names anywhere in the codebase.** The catalogue is data. This is what makes the repo reusable for the next training provider.

```sql
-- ============ intakes ============
-- A cohort of one course with real dates. This is the scheduling unit.
create table intakes (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id),
  label         text,                        -- e.g. "Jan 2026"; derive from start_date if null
  start_date    date not null,
  end_date      date,
  instructor_id uuid references instructors(id),
  capacity      int,
  created_at    timestamptz not null default now()
);
create index on intakes (course_id, start_date desc);

-- ============ enrolments ============
create type enrolment_status as enum ('enrolled', 'completed', 'withdrawn');

create table enrolments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id),
  intake_id     uuid not null references intakes(id),
  agreed_price  numeric(12,2) not null,      -- defaults from course, overridable per student
  price_note    text,                        -- why it differs from default, if it does
  status        enrolment_status not null default 'enrolled',
  enrolled_on   date not null default current_date,
  ended_on      date,
  created_at    timestamptz not null default now(),
  unique (student_id, intake_id)
);
create index on enrolments (student_id);
create index on enrolments (intake_id);
```

A student may hold several enrolments at once (a short course while on a programme). Balances roll up per enrolment and per student.

```sql
-- ============ transactions ============
create type txn_kind as enum ('charge', 'payment', 'adjustment');

create table transactions (
  id            uuid primary key default gen_random_uuid(),
  enrolment_id  uuid not null references enrolments(id),
  kind          txn_kind not null,

  -- SIGN CONVENTION: positive increases what the student owes.
  --   charge     > 0   (course fee, materials fee, late fee)
  --   payment    < 0
  --   adjustment either (discount/write-off negative, correction either way)
  amount        numeric(12,2) not null,
  currency      text not null default 'USD',
  rate_to_usd   numeric(14,4) not null default 1,
  amount_usd    numeric(12,2)
                generated always as (round(amount / rate_to_usd, 2)) stored,

  occurred_on   date not null default current_date,
  method        text,          -- 'cash' | 'ecocash' | 'bank_transfer' | 'other'
  reference     text,          -- EcoCash ref, bank ref, receipt number
  note          text,

  reverses_id   uuid references transactions(id),
  reversal_reason text,

  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),

  constraint charge_positive  check (kind <> 'charge'  or amount > 0),
  constraint payment_negative check (kind <> 'payment' or amount < 0),
  constraint amount_nonzero   check (amount <> 0),
  constraint rate_positive    check (rate_to_usd > 0),
  constraint reversal_has_reason
    check (reverses_id is null or reversal_reason is not null)
);
create index on transactions (enrolment_id, occurred_on desc);
create index on transactions (reverses_id);
create unique index on transactions (reverses_id) where reverses_id is not null;
```

The last index matters: a transaction can only be reversed once.

### Enforce immutability at the database

```sql
create or replace function block_txn_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'transactions are append-only; insert a reversal instead';
end $$;

create trigger transactions_no_update
  before update on transactions
  for each row execute function block_txn_mutation();

create trigger transactions_no_delete
  before delete on transactions
  for each row execute function block_txn_mutation();
```

If a legitimate need to edit appears later, the answer is a new transaction kind, not dropping this trigger.

### Balance views

```sql
create view enrolment_balances as
select
  e.id                as enrolment_id,
  e.student_id,
  e.intake_id,
  e.agreed_price,
  e.status,
  coalesce(sum(t.amount_usd) filter (where t.kind = 'charge'), 0)      as charged,
  coalesce(-sum(t.amount_usd) filter (where t.kind = 'payment'), 0)    as paid,
  coalesce(sum(t.amount_usd) filter (where t.kind = 'adjustment'), 0)  as adjustments,
  coalesce(sum(t.amount_usd), 0)                                       as balance,
  max(t.occurred_on) filter (where t.kind = 'payment')                 as last_payment_on
from enrolments e
left join transactions t on t.enrolment_id = e.id
group by e.id;

create view student_balances as
select
  s.id as student_id,
  s.full_name,
  s.phone,
  coalesce(sum(eb.balance), 0) as balance,
  max(eb.last_payment_on)      as last_payment_on
from students s
left join enrolment_balances eb on eb.student_id = s.id
group by s.id;
```

Query these views. Never recompute balances in application code.

### RLS

Single role: any authenticated user is an administrator. Enable RLS on every table with a policy of `auth.role() = 'authenticated'` for select and insert; no update/delete policy on `transactions`. Do not build a roles table — at this size it's pure support burden.

---

## 5. Business rules to encode

**Enrolling raises the charge immediately.** Creating an enrolment inserts one `charge` transaction for `agreed_price`. Instalment plans are a *display* concern ("due by X"), not a data structure. Do not build a schedule table.

**Materials/ingredients fee** is just another `charge` row on the enrolment. This is how the client recovers ingredient cost without any stock tracking.

**Withdrawal** sets status to `withdrawn` and requires the user to either write off the remaining balance (an `adjustment` for the negative remainder) or keep it owing. Present both options explicitly — do not pick one silently. Withdrawn enrolments with a zero balance drop off the outstanding list.

**Reversal, not edit.** Any transaction row in the UI has a "Reverse this" action which opens a small dialog requiring a reason, then inserts the mirror row. Both rows remain visible in the ledger, the reversed one visually struck through.

**Price override** on enrolment must capture `price_note` when `agreed_price` differs from `courses.default_price`. Prompt for it; don't block on it.

**Archiving, never deleting.** Students, courses, instructors and intakes archive. Nothing hard-deletes.

---

## 6. Screens

Nine screens. Reference mockup for the dashboard: `pbcs-dashboard-mockup.html` (static HTML, matches the intended visual system exactly — port it, don't reinterpret it).

1. **Dashboard** — three stat cards (outstanding total, active students, running intakes), the "Who owes money" table, quick actions, recent payments feed, running intakes list.
2. **Students list** — searchable by name and phone, sortable, balance column, CSV export.
3. **Student detail** — contact fields in a label-above-value grid, enrolments with per-enrolment balance, full transaction ledger, actions.
4. **Enrol a student** — pick student (or create inline), pick intake, agreed price prefilled from course default, price note if changed.
5. **Record a payment** — the most important form in the app. See below.
6. **Courses** — list and edit, including default price. `kind` toggle.
7. **Intakes** — list and create, with student count and outstanding total per intake.
8. **Instructors** — bare CRUD list.
9. **Student statement** — printable, per student or per enrolment. Clean print stylesheet, school name at top, every line item, closing balance.

### Record a payment — specifics

This screen gets opened more than any other, usually immediately after money lands. Optimise it hard.

- Student search first, by **name or phone**, with balance shown in the result row.
- If the student has one enrolment with a balance, preselect it. If several, list them with balances and require a choice.
- Amount, currency (default USD), rate (default 1 for USD, last-used rate for ZWG), date (default today).
- Method as a segmented control: Cash / EcoCash / Bank transfer / Other.
- Reference field — label it contextually ("EcoCash reference", "Bank reference", "Receipt number").
- On save, show the new balance immediately and offer "Print receipt".
- Amount input must accept `50`, `50.00`, and `$50` without complaining.

### Empty and error states

Every list needs a real empty state that offers the action: "No students yet. Add your first student." Errors say what happened and what to do, in plain language. No apologies, no jargon.

### Print

The outstanding list and the student statement **will be printed**. Include a print stylesheet: white background, black text, no rail, no buttons, tabular numbers, page-break avoidance inside rows.

---

## 7. Design system

Extracted from the approved mockup. Use these exactly.

```css
--canvas:#F2EBE0;  --surface:#FFFCF7;  --surface-2:#FAF5EC;
--ink:#1F1B16;     --ink-mid:#5C5348;  --ink-soft:#8B8175;
--line:#E9DFD0;    --line-soft:#F1E8DA;

--crust:#B8651A;   --crust-deep:#8F4C11;  --crust-tint:#FAEBD9;

--sage:#E7EFE3;    --sage-ink:#4A6146;
--sky:#E3E9F4;     --sky-ink:#3F5375;
--butter:#FBF0D3;  --butter-ink:#7A6220;
--rose:#F8E6E2;    --rose-ink:#9C4433;

--danger:#A33A28;

--r-lg:20px; --r-md:14px; --r-sm:9px;
```

**Type:** Fraunces (600) for page titles and stat numbers only. Inter for everything else. Money always `font-variant-numeric: tabular-nums`.

**Navigation:** left icon rail, 94px, icon above label, active item in `--crust-tint`. Collapses to a horizontal scroll strip under 680px.

**Avatars:** initials on tinted backgrounds, cycling through the five accent tints. **Never photo avatars** — the client has no photos and grey placeholder circles look broken.

**Signature element:** under each balance figure, a thin progress bar showing percent paid. `$640 outstanding` doesn't distinguish a deposit-and-vanished from a nearly-finished student; `35%` vs `63%` does, and it drives who gets phoned first. This is the one piece of visual flourish in the app — keep everything else quiet.

**Tone of copy:** plain and direct. "Who owes money", not "Outstanding Balances". "Record a payment", not "Submit transaction". Button verbs match their result: the button that says "Record payment" produces "Payment recorded".

---

## 8. Technical decisions

- **Next.js App Router**, server components by default. Client components only for forms and interactive tables.
- **Supabase Auth**, email + password. No magic links (the office may share a login; deliverability is a support call waiting to happen). Password reset via Supabase's built-in flow.
- **Server actions** for all mutations. No API routes unless something needs them.
- **`@supabase/ssr`** for cookie-based sessions.
- **Zod** for form validation, shared between client and server action.
- **No ORM.** Supabase client with typed queries from generated types (`supabase gen types typescript`).
- **No state library.** Server components plus `useState` in forms is enough.
- **No charting library.** There are no charts.
- Schema lives in `supabase/migrations/`, seed data in `supabase/seed.sql`.
- Deploy to Vercel. **Both Vercel and Supabase projects should be created under the client's own accounts and billing**, not the developer's — otherwise the developer is the sysadmin forever.

---

## 9. Build order

1. Migrations, RLS, views, seed data. Verify the immutability trigger actually fires.
2. Auth + protected layout shell with the icon rail.
3. Courses and intakes CRUD (nothing works without a catalogue).
4. Students list and detail.
5. Enrolment flow.
6. **Record a payment** + the transaction ledger on student detail, including reversal.
7. Dashboard (it's all reads over work already done).
8. Statement + print stylesheets.
9. CSV export on every list.
10. Empty states, error states, mobile pass, keyboard focus, reduced motion.

Ship 1–6 before showing the client anything. The dashboard is the demo, but the payment flow is the product.

---

## 10. Seed data

Seed with the real course catalogue from the client's website:

**Short courses:** Basic Cookery, Intermediate Cookery, Professional Cookery, Snacks Cookery, Basic Baking, Birthday Cakes, Wedding Cakes, Professional Baking, Executive Baking, Food Preparation

**Programmes:** Hospitality Management (NC), Professional Cookery (NC), Food & Beverages (NFC)

Prices are unknown — the site publishes none. Seed with `0` and a comment; the client fills them in on first use. **Do not invent prices in seed data**, they will end up in a demo and become real.

---

## 11. Open questions for the client

Flag these in the README; they change scope if answered a certain way.

1. **Does PBCS hold its own HEXCO examination centre number, or do candidates sit elsewhere?** If they're a registered centre, exam admin is a real phase-two module. If not, it's a text field.
2. **What is the actual withdrawal/refund policy?** Currently modelled as an explicit choice at withdrawal time. If they have a fixed rule, encode it.
3. **Do they issue fiscal tax invoices?** If yes, ZIMRA fiscalisation is a separate conversation and a separate price — it is not in this build.
4. **Are fees ever quoted in ZWG rather than just paid in ZWG?** Current model assumes USD quotation with ZWG payment conversion.
5. **Is there existing data to migrate?** Assumed no. If there's a spreadsheet, a one-off import script is additional scope.

---

## 12. Definition of done

- A payment can be recorded, appear in the ledger, and change the balance — in under 20 seconds.
- Every mistake is reversible through the UI by a non-technical user.
- Every list exports to CSV.
- The outstanding list and a student statement both print cleanly on A4.
- No `balance` column exists anywhere in the schema.
- No course name is hard-coded in the application.
- Works on a phone.
