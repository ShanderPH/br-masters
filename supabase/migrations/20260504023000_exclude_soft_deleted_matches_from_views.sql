create or replace view public.upcoming_matches as
select
  m.id,
  m.slug,
  m.start_time,
  m.status,
  m.round_number,
  m.round_name,
  t.id as tournament_id,
  t.name as tournament_name,
  t.slug as tournament_slug,
  t.logo_url as tournament_logo,
  ts.id as season_id,
  ts.year as season_year,
  ht.id as home_team_id,
  ht.name as home_team_name,
  ht.name_code as home_team_code,
  ht.logo_url as home_team_logo,
  ht.primary_color as home_team_color,
  at.id as away_team_id,
  at.name as away_team_name,
  at.name_code as away_team_code,
  at.logo_url as away_team_logo,
  at.primary_color as away_team_color,
  v.name as venue_name,
  v.city as venue_city,
  count(distinct p.id) as predictions_count,
  extract(epoch from (m.start_time - current_timestamp)) / 3600::numeric as hours_until_start
from public.matches m
join public.tournaments t on m.tournament_id = t.id
join public.tournament_seasons ts on m.season_id = ts.id
join public.teams ht on m.home_team_id = ht.id
join public.teams at on m.away_team_id = at.id
left join public.venues v on m.venue_id = v.id
left join public.predictions p on m.id = p.match_id
where m.status in ('scheduled', 'live')
  and m.deleted_at is null
group by
  m.id,
  m.slug,
  m.start_time,
  m.status,
  m.round_number,
  m.round_name,
  t.id,
  t.name,
  t.slug,
  t.logo_url,
  ts.id,
  ts.year,
  ht.id,
  ht.name,
  ht.name_code,
  ht.logo_url,
  ht.primary_color,
  at.id,
  at.name,
  at.name_code,
  at.logo_url,
  at.primary_color,
  v.name,
  v.city
order by m.start_time;

create or replace view public.recent_results as
select
  m.id,
  m.slug,
  m.start_time,
  m.status,
  m.round_number,
  m.round_name,
  m.home_score,
  m.away_score,
  t.id as tournament_id,
  t.name as tournament_name,
  t.logo_url as tournament_logo,
  ht.id as home_team_id,
  ht.name as home_team_name,
  ht.name_code as home_team_code,
  ht.logo_url as home_team_logo,
  at.id as away_team_id,
  at.name as away_team_name,
  at.name_code as away_team_code,
  at.logo_url as away_team_logo,
  count(distinct p.id) as total_predictions,
  count(distinct case when p.is_exact_score then p.id else null::uuid end) as exact_scores,
  count(distinct case when p.is_correct_result and not coalesce(p.is_exact_score, false) then p.id else null::uuid end) as correct_results,
  case
    when count(distinct p.id) > 0
      then round((count(distinct case when p.is_correct_result then p.id else null::uuid end)::numeric / count(distinct p.id)::numeric) * 100::numeric, 2)
    else 0::numeric
  end as accuracy_rate
from public.matches m
join public.tournaments t on m.tournament_id = t.id
join public.teams ht on m.home_team_id = ht.id
join public.teams at on m.away_team_id = at.id
left join public.predictions p on m.id = p.match_id
where m.status = 'finished'
  and m.deleted_at is null
group by
  m.id,
  m.slug,
  m.start_time,
  m.status,
  m.round_number,
  m.round_name,
  m.home_score,
  m.away_score,
  t.id,
  t.name,
  t.logo_url,
  ht.id,
  ht.name,
  ht.name_code,
  ht.logo_url,
  at.id,
  at.name,
  at.name_code,
  at.logo_url
order by m.start_time desc;
