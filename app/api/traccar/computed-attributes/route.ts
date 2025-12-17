import { NextRequest, NextResponse } from 'next/server'
import { traccarClient, TraccarComputedAttribute } from '@/lib/traccar'

const ALLOWED_PARAMS = ['all', 'userId', 'deviceId', 'groupId', 'refresh'] as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()
    ALLOWED_PARAMS.forEach((key) => {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    })

    const endpoint = `/api/attributes/computed${params.toString() ? `?${params.toString()}` : ''}`
    const response = await traccarClient.get<TraccarComputedAttribute[]>(endpoint)

    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar atributos computados'
    console.error('❌ Computed Attributes - GET erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<TraccarComputedAttribute>
    const required = ['description', 'attribute', 'expression', 'type'] as const
    for (const key of required) {
      if (!payload[key]) {
        return NextResponse.json(
          { success: false, error: `Campo obrigatório: ${key}` },
          { status: 400 }
        )
      }
    }

    const response = await traccarClient.post<TraccarComputedAttribute>('/api/attributes/computed', payload)

    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar atributo'
    console.error('❌ Computed Attributes - POST erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
