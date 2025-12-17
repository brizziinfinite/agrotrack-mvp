import { NextRequest, NextResponse } from 'next/server'
import { traccarClient, TraccarCommand } from '@/lib/traccar'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TraccarCommand

    if (!body.deviceId && !request.nextUrl.searchParams.get('groupId')) {
      return NextResponse.json(
        { success: false, error: 'Informe deviceId ou groupId' },
        { status: 400 }
      )
    }

    const groupId = request.nextUrl.searchParams.get('groupId')
    const query = groupId ? `?groupId=${groupId}` : ''

    const response = await traccarClient.post(`/api/commands/send${query}`, body)

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar comando'
    console.error('❌ Comandos - envio erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
