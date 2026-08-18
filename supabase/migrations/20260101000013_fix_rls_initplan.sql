-- Supabase's performance linter flags `auth.role()` in RLS policies: unwrapped,
-- Postgres re-evaluates it per row instead of once per query. Wrapping it in
-- a sub-select lets the planner treat it as a stable initplan. No behaviour
-- change, just cheaper at scale.

drop policy "students_select" on students;
create policy "students_select" on students
  for select using ((select auth.role()) = 'authenticated');
drop policy "students_insert" on students;
create policy "students_insert" on students
  for insert with check ((select auth.role()) = 'authenticated');
drop policy "students_update" on students;
create policy "students_update" on students
  for update using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');

drop policy "instructors_select" on instructors;
create policy "instructors_select" on instructors
  for select using ((select auth.role()) = 'authenticated');
drop policy "instructors_insert" on instructors;
create policy "instructors_insert" on instructors
  for insert with check ((select auth.role()) = 'authenticated');
drop policy "instructors_update" on instructors;
create policy "instructors_update" on instructors
  for update using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');

drop policy "courses_select" on courses;
create policy "courses_select" on courses
  for select using ((select auth.role()) = 'authenticated');
drop policy "courses_insert" on courses;
create policy "courses_insert" on courses
  for insert with check ((select auth.role()) = 'authenticated');
drop policy "courses_update" on courses;
create policy "courses_update" on courses
  for update using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');

drop policy "intakes_select" on intakes;
create policy "intakes_select" on intakes
  for select using ((select auth.role()) = 'authenticated');
drop policy "intakes_insert" on intakes;
create policy "intakes_insert" on intakes
  for insert with check ((select auth.role()) = 'authenticated');
drop policy "intakes_update" on intakes;
create policy "intakes_update" on intakes
  for update using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');

drop policy "enrolments_select" on enrolments;
create policy "enrolments_select" on enrolments
  for select using ((select auth.role()) = 'authenticated');
drop policy "enrolments_insert" on enrolments;
create policy "enrolments_insert" on enrolments
  for insert with check ((select auth.role()) = 'authenticated');
drop policy "enrolments_update" on enrolments;
create policy "enrolments_update" on enrolments
  for update using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');

drop policy "transactions_select" on transactions;
create policy "transactions_select" on transactions
  for select using ((select auth.role()) = 'authenticated');
drop policy "transactions_insert" on transactions;
create policy "transactions_insert" on transactions
  for insert with check ((select auth.role()) = 'authenticated');
