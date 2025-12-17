import { NextResponse } from 'next/server'
import { traccarClient, TraccarDevice, TraccarPosition } from '@/lib/traccar'

type DeviceWithAttributes = TraccarDevice & {
  attributes?: Record<string, unknown>
  category?: string
}

type PositionMap = Map<number, TraccarPosition>

const normalizeIgnition = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value === 'true' || value === '1'
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return value === true
}

const classifyStatus = (
  deviceStatus: string,
  speedKmh: number,
  ignitionOn: boolean
): 'moving' | 'idle' | 'online' | 'offline' => {
  if (deviceStatus === 'offline') return 'offline'
  if (speedKmh > 1) return 'moving'
  if (ignitionOn && speedKmh === 0) return 'idle'
  return 'online'
}

export async function GET() {
  try {
    const toKmh = (speed: number) => Math.round((speed || 0) * 1.852 * 10) / 10

    // Buscar dispositivos
    const devicesResponse = await traccarClient.get<TraccarDevice[]>('/api/devices')
    const devices = devicesResponse.data as DeviceWithAttributes[]
    
    console.log(`✅ Encontrados ${devices.length} dispositivos`)
    
    // Buscar posições
    let positions: TraccarPosition[] = []
    try {
      const positionsResponse = await traccarClient.get<TraccarPosition[]>('/api/positions')
      positions = positionsResponse.data
      console.log(`✅ Encontradas ${positions.length} posições`)
    } catch {
      console.log('⚠️  Sem posições disponíveis')
    }
    
    // Combinar dados
    const positionsMap: PositionMap = new Map(positions.map((p) => [p.deviceId, p]))
    
    const result = devices.map((device) => {
      const position = positionsMap.get(device.id)
      const speedKmh = position ? toKmh(position.speed) : 0
      const ignitionOn = normalizeIgnition(position?.attributes?.ignition ?? device.attributes?.ignition)
      const statusDetail = classifyStatus(device.status, speedKmh, ignitionOn)

      return {
        id: device.id,
        name: device.name,
        uniqueId: device.uniqueId,
        category: device.category,
        attributes: { ...(device.attributes || {}), ignition: ignitionOn },
        status: device.status,
        statusDetail,
        ignitionOn,
        lastUpdate: device.lastUpdate,
        position: position
          ? {
              ...position,
              speed: speedKmh,
              attributes: { ...(position.attributes || {}), ignition: ignitionOn }
            }
          : null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro:', message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: message
      },
      { status: 500 }
    )
  }
}
