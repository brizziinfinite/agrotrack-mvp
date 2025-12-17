import { NextResponse } from 'next/server'
import { traccarClient, TraccarNotification } from '@/lib/traccar'

export async function GET() {
  try {
    const response = await traccarClient.get<TraccarNotification[]>('/api/notifications')
    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar notificações'
    console.error('❌ Notificações - erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
