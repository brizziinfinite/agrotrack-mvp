import { NextRequest, NextResponse } from 'next/server'
import { traccarClient, TraccarComputedAttribute } from '@/lib/traccar'

type ParamsPromise = Promise<{ id: string }>

export async function PUT(request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })
  }

  try {
    const body = (await request.json()) as Partial<TraccarComputedAttribute>
    const response = await traccarClient.put<TraccarComputedAttribute>(`/api/attributes/computed/${id}`, body)
    return NextResponse.json({ success: true, data: response.data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar atributo'
    console.error('❌ Computed Attributes - PUT erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })
  }

  try {
    await traccarClient.delete(`/api/attributes/computed/${id}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir atributo'
    console.error('❌ Computed Attributes - DELETE erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
