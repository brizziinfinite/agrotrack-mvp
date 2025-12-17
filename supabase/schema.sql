-- Schema bootstrap for Supabase (additive; no drops). Run in SQL Editor.

-- Extensions
create extension if not exists "uuid-ossp";
-- PostGIS is optional but recommended for geospatial indices.
create extension if not exists postgis;

-- Helper to keep updated_at in sync
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Wrapper to process trips for all devices (optionally since a timestamp)
create or replace function public.process_trips_all(p_since timestamptz default null)
returns integer
language plpgsql
as $$
declare
  total_inserted integer := 0;
  device_rec record;
begin
  for device_rec in select id from public.devices loop
    total_inserted := total_inserted + coalesce(public.process_trips(device_rec.id, p_since), 0);
  end loop;
  return total_inserted;
end;
$$;

-- Add telemetry/status columns to existing devices table (uuid PK)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='devices' and column_name='status'
  ) then
    alter table public.devices add column status text default 'offline';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='devices' and column_name='status_detail'
  ) then
    alter table public.devices add column status_detail text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='devices' and column_name='ignition_on'
  ) then
    alter table public.devices add column ignition_on boolean;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='devices' and column_name='last_position_at'
  ) then
    alter table public.devices add column last_position_at timestamptz;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='devices' and column_name='metadata'
  ) then
    alter table public.devices add column metadata jsonb not null default '{}'::jsonb;
  end if;
end;
$$;

create index if not exists devices_status_idx on public.devices(status);
create index if not exists devices_last_position_idx on public.devices(last_position_at desc);
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_devices_touch'
  ) then
    create trigger trg_devices_touch
    before update on public.devices
    for each row execute function public.touch_updated_at();
  end if;
end;
$$;

-- Position fixes ingested from Traccar
create table if not exists public.positions (
  id              uuid primary key default uuid_generate_v4(),
  device_id       uuid not null references public.devices(id) on delete cascade,
  recorded_at     timestamptz not null,
  received_at     timestamptz not null default now(),
  latitude        double precision not null,
  longitude       double precision not null,
  geom            geography(point, 4326),
  speed_kmh       numeric(7,2) not null default 0,
  ignition_on     boolean,
  odometer_km     numeric(12,3),
  course          double precision,
  accuracy        double precision,
  address         text,
  raw             jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists positions_device_time_idx on public.positions(device_id, recorded_at desc);
create unique index if not exists positions_device_recorded_uniq on public.positions(device_id, recorded_at);
create index if not exists positions_geom_idx on public.positions using gist(geom);

-- Trips aggregated from positions
create table if not exists public.trips (
  id                  uuid primary key default uuid_generate_v4(),
  device_id           uuid not null references public.devices(id) on delete cascade,
  start_position_id   uuid references public.positions(id) on delete set null,
  end_position_id     uuid references public.positions(id) on delete set null,
  start_at            timestamptz not null,
  end_at              timestamptz,
  distance_km         numeric(10,3),
  duration_seconds    integer,
  idle_seconds        integer,
  max_speed_kmh       numeric(7,2),
  avg_speed_kmh       numeric(7,2),
  positions_count     integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists trips_device_time_idx on public.trips(device_id, start_at desc);
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_trips_touch') then
    create trigger trg_trips_touch
    before update on public.trips
    for each row execute function public.touch_updated_at();
  end if;
end;
$$;

-- Geofences (polygon or circle)
create table if not exists public.geofences (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  type          text not null check (type in ('polygon', 'circle')),
  geom          geography(polygon, 4326), -- for polygon fences
  center_geom   geography(point, 4326),   -- for circle fences
  radius_m      integer,                  -- for circle fences
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists geofences_geom_idx on public.geofences using gist(coalesce(geom, center_geom));
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_geofences_touch') then
    create trigger trg_geofences_touch
    before update on public.geofences
    for each row execute function public.touch_updated_at();
  end if;
end;
$$;

-- Device x Geofence events (enter/exit)
create table if not exists public.geofence_events (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references public.devices(id) on delete cascade,
  geofence_id   uuid not null references public.geofences(id) on delete cascade,
  position_id   uuid references public.positions(id) on delete set null,
  event_type    text not null check (event_type in ('enter', 'exit')),
  occurred_at   timestamptz not null,
  speed_kmh     numeric(7,2),
  ignition_on   boolean,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists geofence_events_device_time_idx on public.geofence_events(device_id, occurred_at desc);
create index if not exists geofence_events_geofence_time_idx on public.geofence_events(geofence_id, occurred_at desc);

-- Idle (ocioso) sessions derived from positions
create table if not exists public.idle_sessions (
  id                uuid primary key default uuid_generate_v4(),
  device_id         uuid not null references public.devices(id) on delete cascade,
  start_position_id uuid references public.positions(id) on delete set null,
  end_position_id   uuid references public.positions(id) on delete set null,
  geofence_id       uuid references public.geofences(id) on delete set null,
  start_at          timestamptz not null,
  end_at            timestamptz,
  duration_seconds  integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idle_sessions_device_time_idx on public.idle_sessions(device_id, start_at desc);
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_idle_sessions_touch') then
    create trigger trg_idle_sessions_touch
    before update on public.idle_sessions
    for each row execute function public.touch_updated_at();
  end if;
end;
$$;

-- Speed events (e.g., above threshold)
create table if not exists public.speed_events (
  id             uuid primary key default uuid_generate_v4(),
  device_id      uuid not null references public.devices(id) on delete cascade,
  position_id    uuid references public.positions(id) on delete set null,
  occurred_at    timestamptz not null,
  speed_kmh      numeric(7,2) not null,
  speed_limit_kmh numeric(7,2),
  event_type     text not null default 'over_speed',
  created_at     timestamptz not null default now()
);
create index if not exists speed_events_device_time_idx on public.speed_events(device_id, occurred_at desc);

-- RLS: enable and allow authenticated read (service_role bypasses)
alter table public.devices           enable row level security;
alter table public.positions         enable row level security;
alter table public.trips             enable row level security;
alter table public.geofences         enable row level security;
alter table public.geofence_events   enable row level security;
alter table public.idle_sessions     enable row level security;
alter table public.speed_events      enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'devices_auth_read' and tablename = 'devices' and schemaname = 'public'
  ) then
    create policy devices_auth_read on public.devices
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'positions_auth_read' and tablename = 'positions' and schemaname = 'public'
  ) then
    create policy positions_auth_read on public.positions
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'trips_auth_read' and tablename = 'trips' and schemaname = 'public'
  ) then
    create policy trips_auth_read on public.trips
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'geofences_auth_read' and tablename = 'geofences' and schemaname = 'public'
  ) then
    create policy geofences_auth_read on public.geofences
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'geofence_events_auth_read' and tablename = 'geofence_events' and schemaname = 'public'
  ) then
    create policy geofence_events_auth_read on public.geofence_events
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'idle_sessions_auth_read' and tablename = 'idle_sessions' and schemaname = 'public'
  ) then
    create policy idle_sessions_auth_read on public.idle_sessions
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'speed_events_auth_read' and tablename = 'speed_events' and schemaname = 'public'
  ) then
    create policy speed_events_auth_read on public.speed_events
      for select using (auth.role() = 'authenticated');
  end if;
end;
$$;

comment on table public.positions is 'Point-in-time fixes from Traccar; includes ignition and speed.';
comment on table public.trips is 'Aggregated trips per device, derived from positions.';
comment on table public.geofences is 'Electronic fences (polygon or circle).';
comment on table public.geofence_events is 'Enter/exit events for devices crossing geofences.';
comment on table public.idle_sessions is 'Idle (ocioso) sessions with ignition on and speed 0.';
comment on table public.speed_events is 'Speed infractions or maxima per device.';

-- Function to derive trips (simple segmentation: motion vs stopped)
create or replace function public.process_trips(p_device_id uuid, p_since timestamptz default null)
returns integer
language plpgsql
as $$
declare
  inserted_count integer := 0;
begin
  with ordered as (
    select
      id,
      device_id,
      recorded_at,
      speed_kmh,
      ignition_on,
      lag(recorded_at) over (order by recorded_at) as prev_time,
      lag(speed_kmh) over (order by recorded_at) as prev_speed
    from public.positions
    where device_id = p_device_id
      and (p_since is null or recorded_at >= p_since)
    order by recorded_at
  ),
  segments as (
    select
      id,
      device_id,
      recorded_at,
      speed_kmh,
      ignition_on,
      -- define start of a trip when speed > 1 or prev_speed <=1
      case
        when speed_kmh > 1 and coalesce(prev_speed, 0) <= 1 then 1
        else 0
      end as start_flag
    from ordered
  ),
  trip_blocks as (
    select
      *,
      sum(start_flag) over (order by recorded_at rows unbounded preceding) as trip_id
    from segments
  ),
  agg as (
    select
      device_id,
      trip_id,
      min(recorded_at) as start_at,
      max(recorded_at) as end_at,
      min(id) as start_position_id,
      max(id) as end_position_id,
      count(*) as positions_count,
      avg(speed_kmh) as avg_speed_kmh,
      max(speed_kmh) as max_speed_kmh,
      sum(
        case when speed_kmh <= 1 then
          extract(epoch from (lead(recorded_at) over (partition by trip_id order by recorded_at) - recorded_at))
        else 0 end
      ) as idle_seconds_raw,
      sum(
        case
          when lead(recorded_at) over (partition by trip_id order by recorded_at) is not null then
            extract(epoch from (lead(recorded_at) over (partition by trip_id order by recorded_at) - recorded_at))
          else 0 end
      ) as duration_seconds_raw
    from trip_blocks
    group by device_id, trip_id
  )
  -- Compute distance using haversine between consecutive points per trip_id
  , distances as (
    select
      tb.device_id,
      tb.trip_id,
      sum(
        case
          when lead(tb.recorded_at) over (partition by tb.trip_id order by tb.recorded_at) is not null then
            ST_DistanceSphere(
              ST_SetSRID(ST_MakePoint(
                (select longitude from public.positions p where p.id = tb.id),
                (select latitude from public.positions p where p.id = tb.id)
              ), 4326),
              ST_SetSRID(ST_MakePoint(
                (select longitude from public.positions p where p.id = lead(tb.id) over (partition by tb.trip_id order by tb.recorded_at)),
                (select latitude from public.positions p where p.id = lead(tb.id) over (partition by tb.trip_id order by tb.recorded_at))
              ), 4326)
            ) / 1000.0
          else 0 end
      ) as distance_km
    from trip_blocks tb
    group by tb.device_id, tb.trip_id
  )
  insert into public.trips (device_id, start_position_id, end_position_id, start_at, end_at, distance_km, duration_seconds, idle_seconds, max_speed_kmh, avg_speed_kmh, positions_count)
  select
    device_id,
    start_position_id,
    end_position_id,
    start_at,
    end_at,
    coalesce(d.distance_km, 0),
    coalesce(duration_seconds_raw::int, 0),
    coalesce(idle_seconds_raw::int, 0),
    coalesce(max_speed_kmh, 0),
    coalesce(avg_speed_kmh, 0),
    positions_count
  from agg
  left join distances d using (device_id, trip_id)
  where positions_count > 1;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

-- Function to detect geofence enter/exit based on latest position per device
create or replace function public.process_geofence_events()
returns integer
language plpgsql
as $$
declare
  inserted_count integer := 0;
begin
  with latest_positions as (
    select distinct on (device_id)
      device_id,
      geom,
      recorded_at
    from public.positions
    order by device_id, recorded_at desc
  ),
  eval as (
    select
      lp.device_id,
      g.id as geofence_id,
      lp.recorded_at,
      case
        when g.type = 'circle' and g.center_geom is not null and g.radius_m is not null then
          ST_DWithin(lp.geom, g.center_geom, g.radius_m)
        when g.geom is not null then
          ST_Contains(g.geom::geometry, lp.geom::geometry)
        else false
      end as inside
    from latest_positions lp
    cross join public.geofences g
  ),
  changes as (
    select
      e.device_id,
      e.geofence_id,
      e.recorded_at as occurred_at,
      case when e.inside then 'enter'::text else 'exit'::text end as event_type
    from eval e
    left join lateral (
      select event_type
      from public.geofence_events ge
      where ge.device_id = e.device_id
        and ge.geofence_id = e.geofence_id
      order by ge.occurred_at desc
      limit 1
    ) last on true
    where (e.inside = true and coalesce(last.event_type, 'exit') <> 'enter')
       or (e.inside = false and last.event_type = 'enter')
  )
  insert into public.geofence_events (device_id, geofence_id, occurred_at, event_type)
  select device_id, geofence_id, occurred_at, event_type
  from changes;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
