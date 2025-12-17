import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type PositionForDerive = {
  id?: string | null;
  device_id: string;
  recorded_at: string;
  speed_kmh: number;
  ignition_on?: boolean | null;
};

type IdleSession = {
  device_id: string;
  start_at: string;
  end_at: string | null;
  start_position_id: string | null;
  end_position_id: string | null;
};

// Detect idle sessions: ignition_on=true and speed=0, contiguous in time
export const detectIdleSessions = (positions: PositionForDerive[]): IdleSession[] => {
  const sessions: IdleSession[] = [];
  let current: IdleSession | null = null;

  positions.forEach((p) => {
    const isIdle = p.ignition_on === true && Number(p.speed_kmh || 0) === 0;
    if (isIdle) {
      if (!current) {
        current = {
          device_id: p.device_id,
          start_at: p.recorded_at,
          end_at: null,
          start_position_id: p.id ?? null,
          end_position_id: null,
        };
      }
      current.end_at = p.recorded_at;
      current.end_position_id = p.id ?? null;
    } else if (current) {
      sessions.push(current);
      current = null;
    }
  });

  if (current) sessions.push(current);
  return sessions;
};

export const upsertIdleSessions = async (sessions: IdleSession[]) => {
  if (!sessions.length) return;

  const payload = sessions.map((s) => ({
    device_id: s.device_id,
    start_at: s.start_at,
    end_at: s.end_at,
    start_position_id: s.start_position_id,
    end_position_id: s.end_position_id,
    duration_seconds:
      s.end_at && s.start_at
        ? Math.max(0, (new Date(s.end_at).getTime() - new Date(s.start_at).getTime()) / 1000)
        : null,
  }));

  const { error } = await supabaseAdmin.from('idle_sessions').upsert(payload, {
    onConflict: 'device_id,start_at',
  });
  if (error) throw error;
};

type SpeedEvent = {
  device_id: string;
  position_id: string | null;
  occurred_at: string;
  speed_kmh: number;
  speed_limit_kmh?: number;
  event_type: 'over_speed';
};

// Over-speed events: speed_kmh > speed_limit_kmh from device speed_config (if provided)
export const detectSpeedEvents = (positions: PositionForDerive[], speedLimit?: number): SpeedEvent[] => {
  const events: SpeedEvent[] = [];
  if (!speedLimit) return events;

  positions.forEach((p) => {
    if (Number(p.speed_kmh || 0) > speedLimit) {
      events.push({
        device_id: p.device_id,
        position_id: p.id ?? null,
        occurred_at: p.recorded_at,
        speed_kmh: p.speed_kmh,
        speed_limit_kmh: speedLimit,
        event_type: 'over_speed',
      });
    }
  });

  return events;
};

export const upsertSpeedEvents = async (events: SpeedEvent[]) => {
  if (!events.length) return;
  const { error } = await supabaseAdmin.from('speed_events').upsert(events, {
    onConflict: 'device_id,occurred_at,event_type',
  });
  if (error) throw error;
};
