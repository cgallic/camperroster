-- A safeguarding flag must not default to "cleared".
--
-- `safety_approved` defaulted to true, so a volunteer's reference read as safety
-- approved from the moment the row was created — before the reference call had
-- happened, and before any human looked. Both existing rows showed exactly that:
-- safety_approved true, director_reviewed false, one of them still awaiting the
-- call. Nothing in the app reads the column today, which is the only reason this
-- has not already misled someone; the first screen that trusts it inherits the
-- bug.
--
-- After this migration the column has three honest states:
--   null  -- nobody has decided yet
--   true  -- a named person cleared this volunteer
--   false -- a named person did not
--
-- and a decision cannot exist without the person who made it.

-- 1. Clear the decisions nobody actually made. Scoped to rows where
--    director_reviewed is false, which is precisely the set that was never
--    looked at; a real review is left alone.
update public.staff_references
   set safety_approved = null
 where director_reviewed is not true;

-- 2. Stop new rows arriving pre-approved.
alter table public.staff_references alter column safety_approved drop default;

-- 3. Record who decided and when. Without this the flag says a volunteer was
--    cleared but not by whom, which is not much use in a safeguarding review.
alter table public.staff_references
  add column if not exists safety_reviewed_by uuid,
  add column if not exists safety_reviewed_at timestamptz;

-- 4. A decision must carry its author. This is what makes the column mean
--    something: it can no longer be set by a stray update or a default.
alter table public.staff_references drop constraint if exists staff_references_safety_decision_ck;
alter table public.staff_references add constraint staff_references_safety_decision_ck
  check (
    safety_approved is null
    or (safety_reviewed_by is not null and safety_reviewed_at is not null)
  );

comment on column public.staff_references.safety_approved is
  'Null until a named person decides. Never defaulted — a safeguarding flag that says "cleared" before anyone looked is worse than no flag at all.';
comment on column public.staff_references.safety_reviewed_by is
  'auth.users id of the person who made the call. Required whenever safety_approved is set.';
