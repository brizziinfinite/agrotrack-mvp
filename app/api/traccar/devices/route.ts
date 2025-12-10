import { NextResponse } from 'next/server'
import { traccarClient, TraccarDevice, TraccarPosition } from '@/lib/traccar'

type DeviceWithAttributes = TraccarDevice & {
  attributes?: Record<string, unknown>
  category?: string
}

type PositionMap = Map<number, TraccarPosition>

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

      return {
        id: device.id,
        name: device.name,
        uniqueId: device.uniqueId,
        category: device.category,
        attributes: device.attributes || {},
        status: device.status,
        lastUpdate: device.lastUpdate,
        position: position
          ? {
              ...position,
              speed: toKmh(position.speed)
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
