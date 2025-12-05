import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const response = await traccarClient.delete(`/api/devices/${id}`)

    return NextResponse.json({ success: true, data: response.data })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message
      },
      { status: 500 }
    )
  }
}
