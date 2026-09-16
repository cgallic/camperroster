-- Self-serve signup collects a camp name, a slug and the director's details. It
-- does not ask where the camp is, so this column was NOT NULL with nothing to
-- put in it, and every signup would have failed on the insert.
--
-- A camp fills it in later from settings. An empty string in a NOT NULL column
-- would just be a placeholder pretending to be an answer.
alter table public.camps alter column location drop not null;
