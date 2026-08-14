-- Real course catalogue from the client's website. The site publishes no
-- prices, so every row seeds at 0 — the client fills these in on first use.
-- Do not invent prices here; they will end up in a demo and become real.

insert into courses (name, kind, default_price, description) values
  ('Basic Cookery',          'short_course', 0, null), -- price unknown, client to fill in
  ('Intermediate Cookery',   'short_course', 0, null), -- price unknown, client to fill in
  ('Professional Cookery',   'short_course', 0, null), -- price unknown, client to fill in
  ('Snacks Cookery',         'short_course', 0, null), -- price unknown, client to fill in
  ('Basic Baking',           'short_course', 0, null), -- price unknown, client to fill in
  ('Birthday Cakes',         'short_course', 0, null), -- price unknown, client to fill in
  ('Wedding Cakes',          'short_course', 0, null), -- price unknown, client to fill in
  ('Professional Baking',    'short_course', 0, null), -- price unknown, client to fill in
  ('Executive Baking',       'short_course', 0, null), -- price unknown, client to fill in
  ('Food Preparation',       'short_course', 0, null), -- price unknown, client to fill in
  ('Hospitality Management (NC)',  'programme', 0, null), -- price unknown, client to fill in
  ('Professional Cookery (NC)',    'programme', 0, null), -- price unknown, client to fill in
  ('Food & Beverages (NFC)',       'programme', 0, null); -- price unknown, client to fill in
