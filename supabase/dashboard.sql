create or replace function public.get_dashboard_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
with current_profile as (
  select id, organization_id, role
  from public.profiles
  where id = auth.uid()
),
accessible_events as (
  select e.*
  from public.events e
  join current_profile p on p.organization_id = e.organization_id
  where p.role = 'admin'
     or e.owner_id = auth.uid()
     or e.manager_ids ? (auth.uid())::text
),
accessible_tasks as (
  select t.*, e.name as event_name
  from public.tasks t
  join accessible_events e on e.id = t.event_id
),
accessible_vendors as (
  select v.*, e.name as event_name
  from public.vendors v
  join accessible_events e on e.id = v.event_id
),
event_spend as (
  select
    e.id,
    e.name,
    e.date,
    e.venue,
    e.notes,
    e.status,
    e.budget,
    coalesce(sum(v.cost), 0) as spent
  from accessible_events e
  left join accessible_vendors v on v.event_id = e.id
  group by e.id, e.name, e.date, e.venue, e.notes, e.status, e.budget
),
needs_attention as (
  select *
  from (
    select
      format('%s-task-%s', e.id, t.id) as id,
      e.id as event_id,
      t.title as title,
      format('%s / overdue since %s', e.name, to_char(t.due_date, 'DD Mon')) as subtitle,
      'warning' as tone,
      1 as sort_order,
      t.due_date::timestamp as sort_at
    from accessible_tasks t
    join accessible_events e on e.id = t.event_id
    where t.status <> 'done'
      and t.due_date < current_date

    union all

    select
      format('%s-budget', s.id) as id,
      s.id as event_id,
      'Budget above 80%' as title,
      concat(s.name, ' / ₹', round(s.spent)::text, ' committed') as subtitle,
      'critical' as tone,
      2 as sort_order,
      s.date::timestamp as sort_at
    from event_spend s
    where s.budget > 0
      and s.spent > s.budget * 0.8

    union all

    select
      format('%s-vendor-%s', e.id, v.id) as id,
      e.id as event_id,
      format('%s still unconfirmed', v.name) as title,
      format('%s / %s', e.name, coalesce(nullif(v.category, ''), 'Uncategorized')) as subtitle,
      'info' as tone,
      3 as sort_order,
      v.created_at as sort_at
    from accessible_vendors v
    join accessible_events e on e.id = v.event_id
    where v.status = 'Quoted'
  ) attention
  order by sort_order, sort_at
  limit 4
)
select jsonb_build_object(
  'events_count', (select count(*) from accessible_events),
  'open_tasks', (select count(*) from accessible_tasks where status <> 'done'),
  'total_tasks', (select count(*) from accessible_tasks),
  'completed_tasks', (select count(*) from accessible_tasks where status = 'done'),
  'total_vendors', (select count(*) from accessible_vendors),
  'total_contacts', (
    select coalesce(sum(jsonb_array_length(coalesce(contacts, '[]'::jsonb))), 0)
    from accessible_events
  ),
  'total_spend', (select coalesce(sum(cost), 0) from accessible_vendors),
  'total_budget', (select coalesce(sum(budget), 0) from accessible_events),
  'budget_used', (
    select
      case
        when coalesce(sum(budget), 0) = 0 then 0
        else round((coalesce((select sum(cost) from accessible_vendors), 0) / sum(budget)) * 100, 2)
      end
    from accessible_events
  ),
  'vendor_category_data', coalesce((
    select jsonb_agg(
      jsonb_build_object('name', category_name, 'value', category_total)
      order by category_total desc
    )
    from (
      select
        coalesce(nullif(category, ''), 'Uncategorized') as category_name,
        coalesce(sum(cost), 0) as category_total
      from accessible_vendors
      group by coalesce(nullif(category, ''), 'Uncategorized')
    ) category_totals
  ), '[]'::jsonb),
  'spend_trend', coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', split_part(name, ' ', 1),
        'spend', spent,
        'budget', budget
      )
      order by date asc, name asc
    )
    from event_spend
  ), '[]'::jsonb),
  'upcoming_events', coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'date', date,
        'venue', venue,
        'notes', notes,
        'status', status
      )
      order by date asc, name asc
    )
    from accessible_events
  ), '[]'::jsonb),
  'needs_attention', coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'eventId', event_id,
        'title', title,
        'subtitle', subtitle,
        'tone', tone
      )
      order by sort_order asc, sort_at asc
    )
    from needs_attention
  ), '[]'::jsonb)
);
$$;

grant execute on function public.get_dashboard_stats() to authenticated;
