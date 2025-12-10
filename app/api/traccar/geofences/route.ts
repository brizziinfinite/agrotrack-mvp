import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

interface TraccarGeofence {
  id: number
  name: string
  description?: string
  area: string
  attributes?: Record<string, unknown>
}

interface TraccarPermission {
  deviceId: number
  geofenceId: number
}

interface TraccarDevice {
  id: number
  name: string
}

export async function GET() {
  try {
    const [geofencesRes, permissionsRes, devicesRes] = await Promise.all([
      traccarClient.get<TraccarGeofence[]>('/api/geofences'),
      traccarClient.get<TraccarPermission[]>('/api/permissions'),
      traccarClient.get<TraccarDevice[]>('/api/devices')
    ])

    const devicesById = new Map(devicesRes.data.map((d) => [d.id, d.name]))

    const geofences = geofencesRes.data.map((fence) => {
      const linkedDevices = permissionsRes.data
        .filter((perm) => perm.geofenceId === fence.id)
        .map((perm) => ({
          id: perm.deviceId,
          name: devicesById.get(perm.deviceId) || `Dispositivo ${perm.deviceId}`
        }))

      return {
        id: fence.id,
        name: fence.name,
        description: fence.description,
        area: fence.area,
        devices: linkedDevices
      }
    })

    return NextResponse.json({ success: true, data: geofences })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar cercas virtuais'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
