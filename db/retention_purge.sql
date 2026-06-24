-- =====================================================================
-- NTTC Registry — 3-month retention purge (runs INSIDE Supabase)
-- ---------------------------------------------------------------------
-- Rule: keep each record until its NTTC validity (expiry) date + 3 months.
--       A row is deleted once today is past (expiry + 3 months) — i.e. it has
--       been expired for more than 3 months. Records that expired within the
--       last 3 months stay (and show as "Expired" on the dashboard).
--
-- nttc_expiration_date is free TEXT ("Month D, YYYY", a few "M/D/YYYY", plus
-- the occasional typo or blank), so we parse DEFENSIVELY: anything we cannot
-- confidently parse returns NULL and is NEVER deleted. We only ever purge rows
-- we are certain are more than 3 months past expiry (fail-safe by design).
--
-- Run this whole file once in the Supabase SQL editor. It is idempotent:
-- re-running re-creates the function and re-schedules the same named job.
-- =====================================================================

-- 1) Robust text-date parser -------------------------------------------------
create or replace function public.nttc_expiry_date(txt text)
returns date
language plpgsql
immutable
as $$
declare
  s text := btrim(coalesce(txt, ''));
begin
  if s = '' then
    return null;
  end if;

  -- M/D/YYYY or MM/DD/YYYY
  if s ~ '^\d{1,2}/\d{1,2}/\d{4}$' then
    begin
      return to_date(s, 'FMMM/FMDD/YYYY');
    exception when others then
      return null;
    end;
  end if;

  -- "Month D, YYYY" (comma optional; to_date is case-insensitive). An invalid
  -- month spelling raises inside to_date, which we swallow and treat as NULL.
  begin
    return to_date(s, 'FMMonth FMDD, YYYY');
  exception when others then
    begin
      return to_date(s, 'FMMonth FMDD YYYY');
    exception when others then
      return null;
    end;
  end;
end;
$$;

-- 2) Sanity check — how many rows WOULD be purged right now? -----------------
--    (Run this select on its own first; just after the latest seed it is 0.)
select count(*) as would_purge_now
from public.nttc_registry
where public.nttc_expiry_date(nttc_expiration_date) is not null
  and (public.nttc_expiry_date(nttc_expiration_date) + interval '3 months') < current_date;

-- 3) Enable the scheduler ----------------------------------------------------
--    (Or enable it once via Dashboard → Database → Extensions → pg_cron.)
create extension if not exists pg_cron;

-- 4) Schedule the daily purge ------------------------------------------------
--    Runs every day at 18:00 UTC. cron.schedule() upserts by job name, so
--    re-running this file just updates the existing job rather than duplicating
--    it. Adjust the cron expression to taste.
select cron.schedule(
  'nttc-retention-purge',
  '0 18 * * *',
  $job$
    delete from public.nttc_registry
    where public.nttc_expiry_date(nttc_expiration_date) is not null
      and (public.nttc_expiry_date(nttc_expiration_date) + interval '3 months') < current_date;
  $job$
);

-- ---------------------------------------------------------------------------
-- Handy follow-ups (run as needed):
--   select jobid, jobname, schedule, active from cron.job;          -- list jobs
--   select * from cron.job_run_details order by start_time desc limit 10; -- history
--   select cron.unschedule('nttc-retention-purge');                 -- stop the job
-- Run the purge once immediately (optional — same statement the job runs):
--   delete from public.nttc_registry
--   where public.nttc_expiry_date(nttc_expiration_date) is not null
--     and (public.nttc_expiry_date(nttc_expiration_date) + interval '3 months') < current_date;
-- ---------------------------------------------------------------------------
