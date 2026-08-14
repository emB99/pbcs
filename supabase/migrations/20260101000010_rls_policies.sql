-- Single role: any authenticated user is an administrator. No roles table —
-- at this size a permissions matrix is pure support burden.

alter table students     enable row level security;
alter table instructors  enable row level security;
alter table courses      enable row level security;
alter table intakes      enable row level security;
alter table enrolments   enable row level security;
alter table transactions enable row level security;

-- students: select/insert/update (archiving is an update), never delete
create policy "students_select" on students
  for select using (auth.role() = 'authenticated');
create policy "students_insert" on students
  for insert with check (auth.role() = 'authenticated');
create policy "students_update" on students
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- instructors
create policy "instructors_select" on instructors
  for select using (auth.role() = 'authenticated');
create policy "instructors_insert" on instructors
  for insert with check (auth.role() = 'authenticated');
create policy "instructors_update" on instructors
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- courses
create policy "courses_select" on courses
  for select using (auth.role() = 'authenticated');
create policy "courses_insert" on courses
  for insert with check (auth.role() = 'authenticated');
create policy "courses_update" on courses
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- intakes
create policy "intakes_select" on intakes
  for select using (auth.role() = 'authenticated');
create policy "intakes_insert" on intakes
  for insert with check (auth.role() = 'authenticated');
create policy "intakes_update" on intakes
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- enrolments (status/ended_on are updated on withdrawal)
create policy "enrolments_select" on enrolments
  for select using (auth.role() = 'authenticated');
create policy "enrolments_insert" on enrolments
  for insert with check (auth.role() = 'authenticated');
create policy "enrolments_update" on enrolments
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- transactions: select/insert only. No update/delete policy — combined with
-- the triggers in the previous migration, this makes the ledger append-only
-- even to a user with a valid session.
create policy "transactions_select" on transactions
  for select using (auth.role() = 'authenticated');
create policy "transactions_insert" on transactions
  for insert with check (auth.role() = 'authenticated');
