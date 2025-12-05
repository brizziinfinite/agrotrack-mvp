import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

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

    const positionsUrl = `/api/positions?deviceId=${deviceId}&from=${from}&to=${to}`
    const positionsResponse = await traccarClient.get(positionsUrl)
    const positions = positionsResponse.data

    console.log(`✅ Encontradas ${positions.length} posições no histórico`)

    if (positions.length > 1) {
      positions.sort((a: any, b: any) =>
        new Date(a.deviceTime).getTime() - new Date(b.deviceTime).getTime()
      )
    }

    console.log('📊 Buscando estatísticas do Traccar Reports...')
    const summaryUrl = `/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`
    const summaryResponse = await traccarClient.get(summaryUrl)
    const summary = summaryResponse.data[0] || {}

    console.log('📊 Estatísticas do Traccar:', summary)

    const toKmh = (speed: number) => (speed || 0) * 1.852

    const positionsKmh = positions.map((pos: any) => ({
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
    positionsKmh.forEach((pos: any) => {
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

    return NextResponse.json({
      success: true,
      data: {
        positions: positionsKmh,
        statistics: {
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalTime: Math.max(0, Math.round(totalTime)),
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
