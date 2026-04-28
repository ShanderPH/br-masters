create extension if not exists pg_cron with schema extensions;

create index if not exists idx_matches_scheduled_start_time
  on public.matches (start_time)
  where status = 'scheduled';

create or replace function public.set_matches_live_on_start(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated_count integer := 0;
begin
  with due_matches as (
    select m.id
    from public.matches m
    where m.status = 'scheduled'
      and m.start_time <= now()
    order by m.start_time asc
    limit p_limit
  ),
  updated as (
    update public.matches m
    set status = 'live',
        updated_at = now()
    from due_matches d
    where m.id = d.id
    returning 1
  )
  select count(*) into v_updated_count from updated;

  return v_updated_count;
end;
$$;

revoke all on function public.set_matches_live_on_start(integer) from public;
grant execute on function public.set_matches_live_on_start(integer) to postgres, service_role;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
  from cron.job
  where jobname = 'matches-go-live-every-minute';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'matches-go-live-every-minute',
    '* * * * *',
    $$select public.set_matches_live_on_start();$$
  );
end
$$;
