drop policy if exists "Users can view predictions for finished matches" on public.predictions;

create policy "Users can view predictions for live or finished matches"
on public.predictions
for select
to public
using (
  exists (
    select 1
    from public.matches m
    where m.id = predictions.match_id
      and m.status in ('live', 'finished')
  )
);
