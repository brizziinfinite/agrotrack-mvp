/* ARQUIVO 100% CORRIGIDO — COLE TUDO */

import { NextResponse } from 'next/server'
import axios from 'axios'

interface TraccarDevice {
  id: number
  name: string
  uniqueId?: string
  status?: string
  lastUpdate?: string
}

interface TraccarPosition {
  id: number
  deviceId: number
  deviceTime: string
  fixTime: string
  latitude: number
  longitude: number
  speed: number
  attributes: Record<string, unknown>
}

interface ApiResponse {
  success: boolean
  data?: unknown
  error?: string
  stack?: string
}

export async function GET() {
  try {
    const TRACCAR_URL = 'http://178.156.176.177:8082'
    const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
    const TRACCAR_PASSWORD = 'a202595B'

    console.log('🔍 Conectando no Traccar...')

    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')

    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    }

    // Buscar dispositivos
    const devicesResponse = await axios.get<TraccarDevice[]>(`${TRACCAR_URL}/api/devices`, { headers })
    const devices = devicesResponse.data

    console.log(`✅ Encontrados ${devices.length} dispositivos`)

    // Buscar posições
    let positions: TraccarPosition[] = []

    try {
      const positionsResponse = await axios.get<TraccarPosition[]>(`${TRACCAR_URL}/api/positions`, { headers })
      positions = positionsResponse.data
      console.log(`✅ Encontradas ${positions.length} posições`)
    } catch {
      console.log('⚠️  Sem posições disponíveis')
    }

    // Mapear posições por ID do device
    const positionsMap = new Map<number, TraccarPosition>(
      positions.map((p) => [p.deviceId, p])
    )

    // Construir resposta final
    const result = devices.map((device) => ({
      id: device.id,
      name: device.name,
      uniqueId: device.uniqueId,
      status: device.status ?? 'unknown',
      lastUpdate: device.lastUpdate ?? null,
      position: positionsMap.get(device.id) ?? null,
    }))

    const response: ApiResponse = {
      success: true,
      data: result,
    }

    return NextResponse.json(response)
  } catch (error) {
    let message = 'Erro desconhecido'
    let stack = undefined

    if (error instanceof Error) {
      message = error.message
      stack = error.stack
    }

    console.error('❌ Erro ao acessar Traccar:', message)

    const response: ApiResponse = {
      success: false,
      error: message,
      stack,
    }

    return NextResponse.json(response, { status: 500 })
  }
}
