import { NextResponse } from 'next/server';
import { traccarClient, TraccarDevice, TraccarPosition } from '@/lib/traccar';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { detectIdleSessions, detectSpeedEvents, upsertIdleSessions, upsertSpeedEvents } from '@/lib/telemetry';

const toKmh = (speedKnots: number) => Math.round((speedKnots || 0) * 1.852 * 100) / 100;

const normalizeIgnition = (value: unknown): boolean | null => {
  if (typeof value === 'string') return value === 'true' || value === '1';
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'boolean') return value;
  return null;
};

const classifyStatusDetail = (status: string, speed: number, ignition: boolean | null) => {
  if (status === 'offline') return 'offline';
  if (speed > 1) return 'moving';
  if (ignition && speed === 0) return 'idle';
  return 'online';
};

export async function POST() {
  try {
    // 1) Buscar devices e positions do Traccar
    const [{ data: devices }, { data: positions }] = await Promise.all([
      traccarClient.get<TraccarDevice[]>('/api/devices'),
      traccarClient.get<TraccarPosition[]>('/api/positions'),
    ]);

    const positionsMap = new Map<number, TraccarPosition>();
    positions.forEach((p) => positionsMap.set(p.deviceId, p));

    // 2) Upsert devices no Supabase (baseado em traccar_device_id)
    const devicesPayload = devices.map((device) => {
      const position = positionsMap.get(device.id);
      const speedKmh = position ? toKmh(position.speed) : 0;
      const ignition = normalizeIgnition(position?.attributes?.ignition ?? device.attributes?.ignition);
      const statusDetail = classifyStatusDetail(device.status, speedKmh, ignition);

      return {
        traccar_device_id: device.id,
        name: device.name,
        unique_id: device.uniqueId,
        plate: device.attributes?.plate as string | undefined,
        category: device.category,
        status: device.status,
        status_detail: statusDetail,
        ignition_on: ignition ?? undefined,
        last_position_at: position ? position.deviceTime : null,
        metadata: {
          model: device.model,
          contact: device.contact,
          phone: device.phone,
          attributes: device.attributes,
        },
      };
    });

    const { data: upsertedDevices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .upsert(devicesPayload, { onConflict: 'traccar_device_id' })
      .select('id,traccar_device_id,speed_config');

    if (devicesError) {
      throw devicesError;
    }

    const deviceIdMap = new Map<number, string>();
    (upsertedDevices || []).forEach((d) => deviceIdMap.set(d.traccar_device_id, d.id));
    const speedLimitMap = new Map<string, number | undefined>();
    (upsertedDevices || []).forEach((d) => {
      const limit =
        typeof d.speed_config?.max === 'number'
          ? d.speed_config.max
          : undefined;
      speedLimitMap.set(d.id, limit);
    });

    // 3) Upsert positions (deduplicado por device_id + recorded_at)
    type PositionUpsert = {
      device_id: string;
      recorded_at: string;
      received_at: string;
      latitude: number;
      longitude: number;
      speed_kmh: number;
      ignition_on?: boolean;
      odometer_km: number | null;
      course?: number;
      accuracy?: number;
      address?: string;
      raw: TraccarPosition;
      id?: string | null;
    };

    const positionsPayload: PositionUpsert[] = positions
      .map((p): PositionUpsert | null => {
        const deviceId = deviceIdMap.get(p.deviceId);
        if (!deviceId) return null;

        const speedKmh = toKmh(p.speed);
        const ignition = normalizeIgnition(p.attributes?.ignition);

        return {
          device_id: deviceId,
          recorded_at: p.deviceTime,
          received_at: p.serverTime ?? p.fixTime ?? p.deviceTime,
          latitude: p.latitude,
          longitude: p.longitude,
          speed_kmh: speedKmh,
          ignition_on: ignition ?? undefined,
          odometer_km: p.attributes?.totalDistance ? Number(p.attributes.totalDistance) / 1000 : null,
          course: p.course,
          accuracy: p.accuracy,
          address: p.address,
          raw: p,
          id: null,
        };
      })
      .filter((p): p is PositionUpsert => p !== null);

    if (positionsPayload.length > 0) {
      const { error: positionsError } = await supabaseAdmin
        .from('positions')
        .upsert(positionsPayload, { onConflict: 'device_id,recorded_at' });

      if (positionsError) {
        throw positionsError;
      }
    }

    // 4) Derivar eventos (opcional): idle_sessions e speed_events para janela recente
    if (positionsPayload.length > 0) {
      // Agrupar positions por device_id
      const byDevice = new Map<string, PositionUpsert[]>();
      positionsPayload.forEach((p) => {
        const arr = byDevice.get(p.device_id) || [];
        arr.push(p);
        byDevice.set(p.device_id, arr);
      });

      const allIdle: ReturnType<typeof detectIdleSessions> = [];
      const allSpeed: ReturnType<typeof detectSpeedEvents> = [];

      byDevice.forEach((list, deviceId) => {
        // Ordenar por tempo
        list.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
        const idleSessions = detectIdleSessions(list);
        allIdle.push(...idleSessions);

        const limit = speedLimitMap.get(deviceId);
        const speedEvents = detectSpeedEvents(list, limit);
        allSpeed.push(...speedEvents);
      });

      if (allIdle.length) {
        await upsertIdleSessions(allIdle);
      }
      if (allSpeed.length) {
        await upsertSpeedEvents(allSpeed);
      }
    }

    // 5) Processar eventos de cercas (usa PostGIS no banco)
    const { data: geofenceCount, error: geofenceError } = await supabaseAdmin.rpc('process_geofence_events');
    if (geofenceError) {
      console.error('⚠️  Geofence processing error', geofenceError.message);
    }

    return NextResponse.json({
      success: true,
      devices: devicesPayload.length,
      positions: positionsPayload.length,
      idle_sessions: positionsPayload.length ? 'processed' : 0,
      speed_events: positionsPayload.length ? 'processed' : 0,
      geofence_events_inserted: geofenceCount ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('❌ Sync error', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
