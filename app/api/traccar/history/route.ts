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

    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }

    const positionsUrl = `${TRACCAR_URL}/api/positions?deviceId=${deviceId}&from=${from}&to=${to}`
    const positionsResponse = await axios.get(positionsUrl, { headers })
    const positions = positionsResponse.data

    console.log(`✅ Encontradas ${positions.length} posições no histórico`)

    if (positions.length > 1) {
      positions.sort((a: any, b: any) =>
        new Date(a.deviceTime).getTime() - new Date(b.deviceTime).getTime()
      )
    }

    console.log('📊 Buscando estatísticas do Traccar Reports...')
    const summaryUrl = `${TRACCAR_URL}/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`
    const summaryResponse = await axios.get(summaryUrl, { headers })
    const summary = summaryResponse.data[0] || {}

    console.log('📊 Estatísticas do Traccar:', summary)

    const totalDistance = summary?.distance ? summary.distance / 1000 : 0

    // DEBUG: Ver primeiros 5 valores de velocidade
    console.log('🔍 Primeiras 5 velocidades:', positions.slice(0, 5).map((p: any) => p.speed))

    // Calcular velocidades a partir dos positions (já vêm em km/h)
    let maxSpeed = 0
    let totalSpeed = 0
    let movingPoints = 0

    positions.forEach((pos: any) => {
      if (pos.speed && pos.speed > 0) {
        const speedKmh = pos.speed
        if (speedKmh > maxSpeed) {
          maxSpeed = speedKmh
        }
        totalSpeed += speedKmh
        movingPoints++
      }
    })

    const avgSpeed = movingPoints > 0 ? totalSpeed / movingPoints : 0

    // Calcular tempo apenas dos pontos em movimento (speed > 0)
    let totalTime = 0
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].speed > 0 || positions[i - 1].speed > 0) {
        const timeDiff = new Date(positions[i].deviceTime).getTime() - new Date(positions[i - 1].deviceTime).getTime()
        totalTime += timeDiff / 1000 / 60 // converter para minutos
      }
    }

    console.log('📊 Calculado:', { 
      totalDistance, 
      maxSpeed, 
      avgSpeed, 
      totalTime,
      movingPoints 
    })

    return NextResponse.json({
      success: true,
      data: {
        positions,
        statistics: {
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalTime: Math.round(totalTime),
          avgSpeed: Math.round(avgSpeed * 100) / 100,
          maxSpeed: Math.round(maxSpeed * 100) / 100,
          pointCount: positions.length
        }
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
