import { NextResponse } from 'next/server'
import { traccarClient, TraccarPosition } from '@/lib/traccar'

interface SummaryReport {
  deviceId: number
  deviceName?: string
  distance?: number
  averageSpeed?: number
  maxSpeed?: number
}

interface TripReport {
  deviceId: number
  deviceName?: string
  startTime: string
  endTime: string
  startAddress?: string
  endAddress?: string
  distance?: number
  duration?: number
  maxSpeed?: number
  averageSpeed?: number
}

interface StopReport {
  deviceId: number
  deviceName?: string
  startTime: string
  endTime: string
  address?: string
  duration?: number
}

type HistoryResponse = {
  positions: TraccarPosition[]
  statistics: {
    totalDistance: number
    totalTime: number
    avgSpeed: number
    maxSpeed: number
    pointCount: number
  }
  trips: TripReport[]
  stops: StopReport[]
}

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

    console.log('🔍 Buscando histórico de rotas...')
    console.log(`Device: ${deviceId}, Período: ${from} até ${to}`)

    const [positionsResponse, summaryResponse, tripsResponse, stopsResponse] = await Promise.all([
      traccarClient.get<TraccarPosition[]>(`/api/positions?deviceId=${deviceId}&from=${from}&to=${to}`),
      traccarClient.get<SummaryReport[]>(`/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`),
      traccarClient.get<TripReport[]>(`/api/reports/trips?deviceId=${deviceId}&from=${from}&to=${to}`),
      traccarClient.get<StopReport[]>(`/api/reports/stops?deviceId=${deviceId}&from=${from}&to=${to}`),
    ])

    const positions = positionsResponse.data

    console.log(`✅ Encontradas ${positions.length} posições no histórico`)

    if (positions.length > 1) {
      positions.sort((a, b) =>
        new Date(a.deviceTime).getTime() - new Date(b.deviceTime).getTime()
      )
    }

    const summary = summaryResponse.data.find((item) => String(item.deviceId) === deviceId) ?? null
    const trips = tripsResponse.data
    const stops = stopsResponse.data

    console.log('📊 Estatísticas do Traccar:', summary)

    const toKmh = (speed: number) => (speed || 0) * 1.852

    const positionsKmh = positions.map((pos) => ({
      ...pos,
      speed: toKmh(pos.speed)
    }))

    // Distância do próprio Traccar (vem em metros)
    const totalDistance = summary?.distance ? summary.distance / 1000 : 0

    // Velocidade média/máxima do summary (também em nós) com fallback nos pontos
    const summaryAvg = summary?.averageSpeed ? toKmh(summary.averageSpeed) : null
    const summaryMax = summary?.maxSpeed ? toKmh(summary.maxSpeed) : null

    let computedMax = 0
    let computedTotalSpeed = 0
    let computedPoints = 0
    positionsKmh.forEach((pos) => {
      if (pos.speed > computedMax) computedMax = pos.speed
      computedTotalSpeed += pos.speed
      computedPoints++
    })

    const avgSpeed = summaryAvg !== null
      ? summaryAvg
      : computedPoints > 0
        ? computedTotalSpeed / computedPoints
        : 0

    const maxSpeed = summaryMax !== null ? summaryMax : computedMax

    // Tempo total: diferença entre primeiro e último ponto (minutos)
    let totalTime = 0
    if (positionsKmh.length > 1) {
      const first = new Date(positionsKmh[0].deviceTime).getTime()
      const last = new Date(positionsKmh[positionsKmh.length - 1].deviceTime).getTime()
      totalTime = (last - first) / 1000 / 60
    }

    console.log('📊 Consolidado:', {
      totalDistance,
      maxSpeed,
      avgSpeed,
      totalTime,
      pointCount: positionsKmh.length
    })

    const payload: HistoryResponse = {
      positions: positionsKmh,
      statistics: {
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalTime: Math.max(0, Math.round(totalTime)),
        avgSpeed: Math.round(avgSpeed * 100) / 100,
        maxSpeed: Math.round(maxSpeed * 100) / 100,
        pointCount: positions.length
      },
      trips,
      stops
    }

    return NextResponse.json({
      success: true,
      data: payload
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar histórico'
    console.error('❌ Erro ao buscar histórico:', message)

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    )
  }
}
