-- Cash and cheque payments had nowhere honest to go: the method and the
-- registrar's note were being written to `failure_reason`, which reads as an
-- error to anyone looking at the row later.
alter table public.payments
  add column if not exists method text not null default 'card'
    check (method in ('card', 'cash', 'check', 'other')),
  add column if not exists note text;

comment on column public.payments.method is
  'How the money arrived. Stripe writes card; a registrar recording an offline payment picks one of the others.';
comment on column public.payments.note is
  'Free text for offline payments, e.g. a cheque number. Not an error field.';
