import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

interface UpdateDevicePayload {
  id: number
  name: string
  uniqueId: string
  category?: string
  model?: string
  m2m?: string
  plate?: string
  color?: string
  iccid?: string
  speedIdealMax?: number | string
  speedHighMax?: number | string
  speedExtremeName?: string
}

export async function PUT(request: Request) {
  try {
    const body: UpdateDevicePayload = await request.json()
    const { id, name, uniqueId, category, model, m2m, plate, color, iccid, speedIdealMax, speedHighMax, speedExtremeName } = body

    if (!id || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID e Nome são obrigatórios'
        },
        { status: 400 }
      )
    }

    // Criar attributes com dados extras
    const attributes: Record<string, unknown> = {}
    if (m2m) attributes.m2m = m2m
    if (plate) attributes.plate = plate
    if (color) attributes.color = color
    if (iccid) attributes.iccid = iccid
    if (speedIdealMax !== undefined) attributes.speedIdealMax = Number(speedIdealMax)
    if (speedHighMax !== undefined) attributes.speedHighMax = Number(speedHighMax)
    if (speedExtremeName) attributes.speedExtremeName = speedExtremeName

    // Atualizar device no Traccar
    const deviceData = {
      id,
      name,
      uniqueId,
      category: category || 'tractor',
      model: model || '',
      disabled: false,
      attributes
    }

    console.log('🚜 Atualizando máquina no Traccar:', deviceData)

    const response = await traccarClient.put(`/api/devices/${id}`, deviceData)

    console.log('✅ Máquina atualizada com sucesso:', response.data)

    return NextResponse.json({
      success: true,
      data: response.data
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro ao atualizar máquina:', message)

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    )
  }
}
