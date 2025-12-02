import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!deviceId || !from || !to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros obrigatórios: deviceId, from, to'
        },
        { status: 400 }
      )
    }

    const TRACCAR_URL = 'http://178.156.176.177:8082'
    const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
    const TRACCAR_PASSWORD = 'a202595B'

    console.log('🔍 Buscando histórico de rotas...')
    console.log(`Device: ${deviceId}, Período: ${from} até ${to}`)

    // Criar autenticação
    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }

    // Buscar informações do device para pegar speedConfig
    const deviceUrl = `${TRACCAR_URL}/api/devices?id=${deviceId}`
    const deviceResponse = await axios.get(deviceUrl, { headers })
    const device = deviceResponse.data[0]
    const speedConfig = device?.attributes?.speedConfig || { low: 8, ideal: 18, high: 30 }

    console.log('⚡ SpeedConfig do device:', speedConfig)

    // Buscar posições históricas
    const positionsUrl = `${TRACCAR_URL}/api/positions?deviceId=${deviceId}&from=${from}&to=${to}`
    const positionsResponse = await axios.get(positionsUrl, { headers })
    const positions = positionsResponse.data

    console.log(`✅ Encontradas ${positions.length} posições no histórico`)

    // NOVA PARTE: Buscar estatísticas da API de Reports do Traccar
    const summaryUrl = `${TRACCAR_URL}/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`
    const summaryResponse = await axios.get(summaryUrl, { headers })
    const summary = summaryResponse.data[0] // Primeiro item do array

    // Usar estatísticas do próprio Traccar (mais precisas!)
    const totalDistance = summary?.distance ? summary.distance / 1000 : 0 // metros para km
    const maxSpeed = summary?.maxSpeed || 0
    const avgSpeed = summary?.averageSpeed || 0

    // Calcular tempo total
    let totalTime = 0
    if (positions.length > 1) {
      const firstTime = new Date(positions[0].deviceTime).getTime()
      const lastTime = new Date(positions[positions.length - 1].deviceTime).getTime()
      totalTime = (lastTime - firstTime) / 1000 / 60 // em minutos
    }

    return NextResponse.json({
      success: true,
      data: {
        positions,
        statistics: {
          totalDistance: Math.round(totalDistance * 100) / 100, // km
          totalTime: Math.round(totalTime), // minutos
          avgSpeed: Math.round(avgSpeed * 100) / 100, // km/h
          maxSpeed: Math.round(maxSpeed * 100) / 100, // km/h
          pointCount: positions.length
        },
        speedConfig
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar histórico:', error.message)

    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}