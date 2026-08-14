-- Ensure gen_random_uuid() is available. Supabase projects usually have this
-- already, but keep it explicit so the migration set is self-contained.
create extension if not exists pgcrypto;
