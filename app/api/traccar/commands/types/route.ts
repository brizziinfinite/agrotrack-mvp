import { NextRequest, NextResponse } from 'next/server'
import { traccarClient, TraccarCommandType } from '@/lib/traccar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()

    const deviceId = searchParams.get('deviceId')
    const textChannel = searchParams.get('textChannel')

    if (deviceId) params.set('deviceId', deviceId)
    if (textChannel) params.set('textChannel', textChannel)

    const endpoint = `/api/commands/types${params.toString() ? `?${params.toString()}` : ''}`
    const response = await traccarClient.get<TraccarCommandType[]>(endpoint)

    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar tipos de comando'
    console.error('❌ Comandos - tipos erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
