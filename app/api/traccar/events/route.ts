import { NextResponse } from 'next/server'
import { traccarClient, TraccarEvent } from '@/lib/traccar'

const ALLOWED_PARAMS = ['deviceId', 'type', 'from', 'to', 'limit'] as const

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()

    ALLOWED_PARAMS.forEach((key) => {
      const value = searchParams.get(key)
      if (value) {
        params.set(key, value)
      }
    })

    if (!params.has('limit')) {
      params.set('limit', '200')
    }

    const endpoint = `/api/events${params.toString() ? `?${params.toString()}` : ''}`
    const response = await traccarClient.get<TraccarEvent[]>(endpoint)

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar eventos'
    console.error('❌ Eventos - erro:', message)

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
