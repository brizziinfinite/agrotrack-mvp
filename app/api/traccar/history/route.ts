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
    idleTime: number
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

    const download = searchParams.get('download') === '1'

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
    const normalizeDuration = (value?: number) =>
      typeof value === 'number' && Number.isFinite(value) ? Math.round(value / 1000) : undefined

    const trips = tripsResponse.data.map((trip) => ({
      ...trip,
      duration: normalizeDuration(trip.duration)
    }))

    const stops = stopsResponse.data.map((stop) => ({
      ...stop,
      duration: normalizeDuration(stop.duration)
    }))

    console.log('📊 Estatísticas do Traccar:', summary)

    const toKmh = (speed: number) => (speed || 0) * 1.852

    const positionsKmh = positions.map((pos) => ({
      ...pos,
      speed: toKmh(pos.speed)
    }))

    // Distância do próprio Traccar (vem em metros)
    let totalDistance = summary?.distance ? summary.distance / 1000 : 0

    if ((!totalDistance || Number.isNaN(totalDistance)) && positions.length > 1) {
      const firstDistance = positions[0].attributes?.totalDistance ?? null
      const lastDistance = positions[positions.length - 1].attributes?.totalDistance ?? null
      if (typeof firstDistance === 'number' && typeof lastDistance === 'number' && lastDistance > firstDistance) {
        totalDistance = (lastDistance - firstDistance) / 1000
      } else {
        const sumDistance = positions.reduce((acc, pos) => {
          const diff = typeof pos.attributes?.distance === 'number' ? pos.attributes.distance : 0
          return acc + diff
        }, 0)
        totalDistance = sumDistance / 1000
      }
    }

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

    // Marcha lenta: motor ligado porém velocidade zero
    const isIgnitionOn = (pos: TraccarPosition) => {
      const ignition = pos.attributes?.ignition
      if (typeof ignition === 'boolean') return ignition
      return pos.speed > 0
    }

    let idleTimeSeconds = 0
    for (let i = 0; i < positionsKmh.length - 1; i += 1) {
      const current = positionsKmh[i]
      const next = positionsKmh[i + 1]
      const deltaSeconds = (new Date(next.deviceTime).getTime() - new Date(current.deviceTime).getTime()) / 1000
      if (deltaSeconds <= 0 || !Number.isFinite(deltaSeconds) || deltaSeconds > 60 * 60) continue
      if (isIgnitionOn(current) && current.speed <= 1) {
        idleTimeSeconds += deltaSeconds
      }
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
        pointCount: positions.length,
        idleTime: Math.round(idleTimeSeconds),
      },
      trips,
      stops
    }

    if (download) {
      const headers = [
        'Horário',
        'Latitude',
        'Longitude',
        'Velocidade (km/h)',
        'Endereço',
        'Ignição',
        'Status'
      ]

      const mapValue = (value: unknown) => {
        const stringValue = value === null || value === undefined ? '' : String(value)
        return `"${stringValue.replace(/"/g, '""')}"`
      }

      const rows = positionsKmh.map((pos) => {
        const status = pos.speed > 1 ? 'Em movimento' : 'Parado'
        const ignition =
          typeof pos.attributes?.ignition === 'boolean'
            ? pos.attributes.ignition
              ? 'Ligada'
              : 'Desligada'
            : ''

        return [
          new Date(pos.deviceTime).toLocaleString('pt-BR'),
          pos.latitude.toFixed(6),
          pos.longitude.toFixed(6),
          pos.speed.toFixed(2),
          pos.address || '',
          ignition,
          status
        ]
          .map(mapValue)
          .join(';')
      })

      const csvContent = [headers.map(mapValue).join(';'), ...rows].join('\n')
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=\"historico_${deviceId}_${Date.now()}.csv\"`
        }
      })
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
