import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

interface DeleteBody {
  id: number
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json() as DeleteBody

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const response = await traccarClient.delete(`/api/devices/${id}`)

    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar dispositivo'
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    )
  }
}
