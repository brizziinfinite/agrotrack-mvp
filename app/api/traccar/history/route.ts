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

    // Buscar posições históricas
    const url = `${TRACCAR_URL}/api/positions?deviceId=${deviceId}&from=${from}&to=${to}`
    const response = await axios.get(url, { headers })
    const positions = response.data

    console.log(`✅ Encontradas ${positions.length} posições no histórico`)

    // Calcular estatísticas
    let totalDistance = 0
    let totalTime = 0
    let maxSpeed = 0
    let speedSum = 0
    let speedCount = 0

    if (positions.length > 1) {
      // Ordenar por data
      positions.sort((a: any, b: any) =>
        new Date(a.deviceTime).getTime() - new Date(b.deviceTime).getTime()
      )

      // Calcular distância total usando fórmula de Haversine
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1]
        const curr = positions[i]

        const distance = calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        )

        totalDistance += distance

        // Velocidade máxima
        if (curr.speed > maxSpeed) {
          maxSpeed = curr.speed
        }

        // Média de velocidade (apenas quando em movimento)
        if (curr.speed > 0) {
          speedSum += curr.speed
          speedCount++
        }
      }

      // Tempo total
      const firstTime = new Date(positions[0].deviceTime).getTime()
      const lastTime = new Date(positions[positions.length - 1].deviceTime).getTime()
      totalTime = (lastTime - firstTime) / 1000 / 60 // em minutos
    }

    const avgSpeed = speedCount > 0 ? speedSum / speedCount : 0

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

// Função para calcular distância entre dois pontos (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRad(value: number): number {
  return value * Math.PI / 180
}
