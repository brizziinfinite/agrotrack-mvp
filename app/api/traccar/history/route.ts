import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'
import { traccarClient, TraccarPosition } from '@/lib/traccar'

type TraccarSummaryReport = {
  deviceId: number
  distance: number
  maxSpeed: number
  averageSpeed: number
  engineHours?: number
  fuelUsed?: number
}

const KNOTS_TO_KMH = 1.852

function knotsToKmh(knots: number): number {
  return Number(((knots || 0) * KNOTS_TO_KMH).toFixed(2))
}

function buildStatsFromPositions(positions: TraccarPosition[]) {
  if (!positions.length) {
    return {
      distance: 0,
      maxSpeed: 0,
      averageSpeed: 0,
      engineHours: 0,
      fuelUsed: 0,
    }
  }

  let distance = 0
  let maxSpeed = 0
  let speedSum = 0
  let speedCount = 0
  let engineHours = 0

  for (const pos of positions) {
    const attrs = pos.attributes || {}

    // distância incremental (se o totalDistance existir)
    if (typeof attrs.totalDistance === 'number') {
      distance = Math.max(distance, attrs.totalDistance)
    }

    // horas de motor (se existir)
    if (typeof attrs.hours === 'number') {
      engineHours = Math.max(engineHours, attrs.hours)
    }

    const speedKmh = knotsToKmh(pos.speed)
    maxSpeed = Math.max(maxSpeed, speedKmh)
    speedSum += speedKmh
    speedCount += 1
  }

  const averageSpeed = speedCount > 0 ? speedSum / speedCount : 0

  // distance em km se vier em metros
  if (distance > 10000) {
    distance = distance / 1000
  }

  return {
    distance,
    maxSpeed,
    averageSpeed,
    engineHours,
    fuelUsed: 0,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceIdParam = searchParams.get('deviceId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!deviceIdParam || !from || !to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros obrigatórios faltando: deviceId, from, to',
        },
        { status: 400 },
      )
    }

    const deviceId = Number(deviceIdParam)
    if (Number.isNaN(deviceId)) {
      return NextResponse.json(
        { success: false, error: 'deviceId deve ser numérico' },
        { status: 400 },
      )
    }

    let summary: TraccarSummaryReport | null = null
    let positions: TraccarPosition[] = []

    // 1) tenta usar os relatórios do Traccar
    try {
      const [summaryResponse, routeResponse] = await Promise.all([
        traccarClient.post<TraccarSummaryReport[]>('/api/reports/summary', {
          deviceIds: [deviceId],
          from,
          to,
          daily: false,
        }),
        traccarClient.post<TraccarPosition[]>('/api/reports/route', {
          deviceId,
          from,
          to,
        }),
      ])

      summary = summaryResponse.data?.[0] ?? null
      positions = routeResponse.data ?? []
    } catch (error) {
      const err = error as AxiosError
      console.warn(
        '⚠️ Falha ao usar /api/reports no Traccar, tentando fallback em /api/positions. Status:',
        err.response?.status,
      )
    }

    // 2) se não veio posição via reports, busca em /api/positions
    if (!positions.length) {
      const params = new URLSearchParams({
        deviceId: String(deviceId),
        from,
        to,
      })
      const positionsResponse = await traccarClient.get<TraccarPosition[]>(
        `/api/positions?${params.toString()}`,
      )
      positions = positionsResponse.data ?? []
    }

    // 3) monta stats (prioriza summary, senão calcula)
    const stats = summary
      ? {
          distance: summary.distance ?? 0,
          maxSpeed: knotsToKmh(summary.maxSpeed ?? 0),
          averageSpeed: knotsToKmh(summary.averageSpeed ?? 0),
          engineHours: summary.engineHours ?? 0,
          fuelUsed: summary.fuelUsed ?? 0,
        }
      : buildStatsFromPositions(positions)

    const positionsWithSpeed = positions.map((position) => ({
      ...position,
      speed: knotsToKmh(position.speed),
    }))

    return NextResponse.json({
      success: true,
      data: {
        deviceId,
        from,
        to,
        stats,
        positions: positionsWithSpeed,
      },
    })
  } catch (error) {
    const err = error as AxiosError
    console.error('❌ Erro em /api/traccar/history:', err.message)

    const status = err.response?.status ?? 500

    return NextResponse.json(
      {
        success: false,
        error:
          'Erro ao buscar histórico no Traccar. Verifique usuário, permissões e intervalo de datas.',
        details: err.message,
        traccarStatus: status,
      },
      { status: 500 },
    )
  }
}
