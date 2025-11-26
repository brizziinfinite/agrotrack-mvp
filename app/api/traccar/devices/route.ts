import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    const TRACCAR_URL = 'http://178.156.176.177:8082'
    const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
    const TRACCAR_PASSWORD = 'a202595B'
    
    console.log('🔍 Conectando no Traccar...')
    
    // Criar autenticação
    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')
    
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
    
    // Buscar dispositivos
    const devicesResponse = await axios.get(`${TRACCAR_URL}/api/devices`, { headers })
    const devices = devicesResponse.data
    
    console.log(`✅ Encontrados ${devices.length} dispositivos`)
    
    // Buscar posições
    let positions = []
    try {
      const positionsResponse = await axios.get(`${TRACCAR_URL}/api/positions`, { headers })
      positions = positionsResponse.data
      console.log(`✅ Encontradas ${positions.length} posições`)
    } catch (e) {
      console.log('⚠️  Sem posições disponíveis')
    }
    
    // Combinar dados
    const positionsMap = new Map(positions.map((p: any) => [p.deviceId, p]))
    
    const result = devices.map((device: any) => ({
      id: device.id,
      name: device.name,
      uniqueId: device.uniqueId,
      status: device.status,
      lastUpdate: device.lastUpdate,
      position: positionsMap.get(device.id) || null
    }))
    
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