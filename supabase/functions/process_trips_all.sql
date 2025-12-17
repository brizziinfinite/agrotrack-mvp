-- Run this after positions ingest to aggregate trips for all devices
-- Optional param: since timestamp to limit computation
create or replace function public.process_trips_all(p_since timestamptz default null)
returns integer
language plpgsql
as $$
declare
  total_inserted integer := 0;
begin
  for device_rec in select id from public.devices loop
    total_inserted := total_inserted + coalesce(public.process_trips(device_rec.id, p_since), 0);
  end loop;
  return total_inserted;
end;
$$;
