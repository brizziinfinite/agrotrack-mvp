import { NextRequest, NextResponse } from 'next/server'
import { traccarClient, TraccarNotification } from '@/lib/traccar'

type ParamsPromise = Promise<{ id: string }>

export async function PUT(request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })
  }

  try {
    const body: TraccarNotification = await request.json()
    const response = await traccarClient.put<TraccarNotification>(`/api/notifications/${id}`, body)
    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar notificação'
    console.error('❌ Notificações - atualização erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
