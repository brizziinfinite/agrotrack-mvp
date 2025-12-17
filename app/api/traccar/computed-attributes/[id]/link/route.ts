import { NextRequest, NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

type ParamsPromise = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })
  }

  try {
    const body = (await request.json()) as { deviceId?: number; groupId?: number }
    if (!body.deviceId && !body.groupId) {
      return NextResponse.json({ success: false, error: 'Informe deviceId ou groupId' }, { status: 400 })
    }

    const payload = {
      attributeId: Number(id),
      ...(body.deviceId ? { deviceId: body.deviceId } : {}),
      ...(body.groupId ? { groupId: body.groupId } : {}),
    }

    await traccarClient.post('/api/permissions', payload)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao vincular atributo'
    console.error('❌ Computed Attributes - vincular erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })
  }

  try {
    const body = (await request.json()) as { deviceId?: number; groupId?: number }
    if (!body.deviceId && !body.groupId) {
      return NextResponse.json({ success: false, error: 'Informe deviceId ou groupId' }, { status: 400 })
    }

    const payload = {
      attributeId: Number(id),
      ...(body.deviceId ? { deviceId: body.deviceId } : {}),
      ...(body.groupId ? { groupId: body.groupId } : {}),
    }

    await traccarClient.delete('/api/permissions', { data: payload })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao desvincular atributo'
    console.error('❌ Computed Attributes - desvincular erro:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
