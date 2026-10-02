-- Demo data for exploring the app (a small college). Safe to run once on an
-- empty database; it does nothing if a school already exists. Not part of the
-- migrations. Run it in the Supabase SQL editor (it runs as a privileged role,
-- so it bypasses RLS).

do $$
declare
  grace uuid; tendai uuid; ruth uuid;
  dip uuid; cake uuid; bread uuid;
  i_dip uuid; i_cake uuid; i_bread uuid;
begin
  if exists (select 1 from public.school_settings) then
    raise notice 'School already set up; skipping demo data.';
    return;
  end if;

  insert into public.school_settings (name, school_type, student_number_prefix, email, phone, address)
  values ('Demo College', 'college', 'S', 'office@demo.test', '+263 77 000 0000', '12 Example Road, Harare');

  insert into public.instructors (full_name, phone, email) values ('Grace Moyo', '0771 100 200', 'grace@demo.test') returning id into grace;
  insert into public.instructors (full_name, phone) values ('Tendai Chikwanha', '0772 300 400') returning id into tendai;
  insert into public.instructors (full_name, email) values ('Ruth Ndlovu', 'ruth@demo.test') returning id into ruth;

  insert into public.courses (name, kind, default_price, default_weeks, description)
  values ('Diploma in Culinary Arts', 'programme', 1800, 52, 'One-year professional programme') returning id into dip;
  insert into public.courses (name, kind, default_price, default_weeks, description)
  values ('Cake Decorating', 'short_course', 250, 4, 'Four-week hands-on short course') returning id into cake;
  insert into public.courses (name, kind, default_price, default_weeks)
  values ('Bread Baking', 'short_course', 180, 3) returning id into bread;

  insert into public.subjects (course_id, name, code, sort_order) values
    (dip, 'Food Safety & Hygiene', 'CUL101', 1),
    (dip, 'Pastry Fundamentals', 'CUL102', 2),
    (dip, 'Kitchen Management', 'CUL103', 3),
    (dip, 'Menu Planning & Costing', 'CUL104', 4),
    (cake, 'Buttercream Techniques', 'CAK1', 1),
    (cake, 'Fondant & Sugar Work', 'CAK2', 2),
    (bread, 'Yeast Doughs', 'BRD1', 1);

  insert into public.terms (name, academic_year, start_date, end_date) values
    ('Semester 1', '2026', '2026-01-12', '2026-06-26'),
    ('Semester 2', '2026', '2026-07-20', '2026-12-04');

  -- Each insert seeds one intake_subjects row per subject (trigger).
  insert into public.intakes (course_id, label, start_date, end_date, instructor_id, capacity)
  values (dip, 'January 2026', '2026-01-12', '2026-12-18', grace, 20) returning id into i_dip;
  insert into public.intakes (course_id, label, start_date, end_date, instructor_id, capacity)
  values (cake, 'October 2026', '2026-10-05', '2026-10-30', tendai, 12) returning id into i_cake;
  insert into public.intakes (course_id, label, start_date, end_date, instructor_id, capacity)
  values (bread, 'September 2026', '2026-09-14', '2026-10-02', ruth, 12) returning id into i_bread;

  update public.intake_subjects set instructor_id = grace
   where intake_id = i_dip and subject_id in (select id from public.subjects where code in ('CUL101', 'CUL103'));
  update public.intake_subjects set instructor_id = tendai
   where intake_id = i_dip and subject_id in (select id from public.subjects where code in ('CUL102', 'CUL104'));
  update public.intake_subjects set instructor_id = tendai where intake_id = i_cake;
  update public.intake_subjects set instructor_id = ruth where intake_id = i_bread;

  insert into public.students (full_name, phone, email, date_of_birth, gender, status) values
    ('Tariro Moyo',      '0771 234 567', 'tariro@example.com', '2003-04-12', 'female', 'active'),
    ('Farai Dube',       '0772 345 678', null,                 '2001-09-30', 'male',   'active'),
    ('Chipo Nyathi',     '0773 456 789', 'chipo@example.com',  '2000-01-22', 'female', 'active'),
    ('Tafadzwa Sibanda', '0774 567 890', null,                 '2002-06-05', 'male',   'active'),
    ('Rudo Mutasa',      '0775 678 901', 'rudo@example.com',   '1999-11-17', 'female', 'active'),
    ('Blessing Ncube',   '0776 789 012', null,                 '2004-02-28', 'male',   'suspended'),
    ('Nyasha Chuma',     '0777 890 123', 'nyasha@example.com', '2001-12-09', 'female', 'active'),
    ('Kudzai Banda',     '0778 901 234', null,                 '1998-07-14', 'male',   'graduated');

  insert into public.guardians (student_id, full_name, relationship, phone, is_primary)
  select id, 'Mr Moyo', 'Father', '0712 111 222', true from public.students where full_name = 'Tariro Moyo';
  insert into public.guardians (student_id, full_name, relationship, phone, is_primary)
  select id, 'Mrs Dube', 'Mother', '0713 222 333', true from public.students where full_name = 'Farai Dube';

  create temp table intake_key (k text, id uuid) on commit drop;
  insert into intake_key values ('dip', i_dip), ('cake', i_cake), ('bread', i_bread);

  insert into public.enrolments (student_id, intake_id, agreed_price, price_note, enrolled_on, status)
  select s.id, k.id, v.price, v.note, v.on_date::date, v.status::public.enrolment_status
  from (values
    ('Tariro Moyo',      'dip',   1800, null,              '2026-01-05', 'enrolled'),
    ('Farai Dube',       'dip',   1800, null,              '2026-01-06', 'enrolled'),
    ('Chipo Nyathi',     'dip',   1500, 'Early-bird rate', '2026-01-03', 'enrolled'),
    ('Tafadzwa Sibanda', 'dip',   1800, null,              '2026-01-10', 'enrolled'),
    ('Rudo Mutasa',      'cake',   250, null,              '2026-09-28', 'enrolled'),
    ('Nyasha Chuma',     'cake',   250, null,              '2026-09-30', 'enrolled'),
    ('Tariro Moyo',      'bread',  180, null,              '2026-09-10', 'enrolled'),
    ('Blessing Ncube',   'bread',  180, null,              '2026-09-10', 'enrolled'),
    ('Kudzai Banda',     'dip',   1800, null,              '2025-01-08', 'completed')
  ) as v(name, ikey, price, note, on_date, status)
  join public.students s on s.full_name = v.name
  join intake_key k on k.k = v.ikey;

  update public.enrolments set ended_on = '2025-12-12'
   where status = 'completed';

  insert into public.transactions (enrolment_id, kind, amount, occurred_on, note)
  select id, 'charge', agreed_price, enrolled_on, 'Course fee' from public.enrolments;

  insert into public.transactions (enrolment_id, kind, amount, occurred_on, method, reference)
  select e.id, 'payment', -v.amount, v.on_date::date, v.method, v.ref
  from (values
    ('Tariro Moyo',      'dip',  900, '2026-01-06', 'ecocash',       'EC1001'),
    ('Tariro Moyo',      'dip',  600, '2026-04-02', 'cash',          null),
    ('Tariro Moyo',      'bread',180, '2026-09-10', 'cash',          null),
    ('Farai Dube',       'dip',  400, '2026-02-01', 'bank_transfer', 'BT-5521'),
    ('Chipo Nyathi',     'dip', 1500, '2026-01-04', 'bank_transfer', 'BT-5399'),
    ('Tafadzwa Sibanda', 'dip',  300, '2026-01-12', 'cash',          null),
    ('Rudo Mutasa',      'cake', 250, '2026-09-29', 'ecocash',       'EC2044'),
    ('Nyasha Chuma',     'cake', 100, '2026-10-01', 'cash',          null),
    ('Kudzai Banda',     'dip', 1800, '2025-02-10', 'bank_transfer', 'BT-1002')
  ) as v(name, ikey, amount, on_date, method, ref)
  join public.students s on s.full_name = v.name
  join intake_key k on k.k = v.ikey
  join public.enrolments e on e.student_id = s.id and e.intake_id = k.id;
end $$;
