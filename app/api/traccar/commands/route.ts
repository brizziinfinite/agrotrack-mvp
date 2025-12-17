import { NextRequest, NextResponse } from 'next/server'
import { traccarClient, TraccarCommand } from '@/lib/traccar'

const ALLOWED_QUERY = ['deviceId', 'groupId', 'userId', 'all'] as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()

    ALLOWED_QUERY.forEach((key) => {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    })

    const endpoint = `/api/commands${params.toString() ? `?${params.toString()}` : ''}`
    const response = await traccarClient.get<TraccarCommand[]>(endpoint)

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar comandos'
    console.error('❌ Comandos - erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
