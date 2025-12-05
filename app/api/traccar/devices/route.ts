import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

export async function GET() {
  try {
    const toKmh = (speed: number) => Math.round((speed || 0) * 1.852 * 10) / 10

    // Buscar dispositivos
    const devicesResponse = await traccarClient.get('/api/devices')
    const devices = devicesResponse.data
    
    console.log(`✅ Encontrados ${devices.length} dispositivos`)
    
    // Buscar posições
    let positions = []
    try {
      const positionsResponse = await traccarClient.get('/api/positions')
      positions = positionsResponse.data
      console.log(`✅ Encontradas ${positions.length} posições`)
    } catch (e) {
      console.log('⚠️  Sem posições disponíveis')
    }
    
    // Combinar dados
    const positionsMap = new Map(positions.map((p: any) => [p.deviceId, p]))
    
    const result = devices.map((device: any) => {
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
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
