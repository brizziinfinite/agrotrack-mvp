import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

interface CreateDevicePayload {
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

export async function POST(request: Request) {
  try {
    const body: CreateDevicePayload = await request.json()
    const { name, uniqueId, category, model, m2m, plate, color, iccid, speedIdealMax, speedHighMax, speedExtremeName } = body

    if (!name || !uniqueId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome e IMEI são obrigatórios'
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

    // Criar device no Traccar
    const deviceData = {
      name,
      uniqueId,
      category: category || 'tractor',
      model: model || '',
      disabled: false,
      attributes
    }

    console.log('🚜 Criando máquina no Traccar:', deviceData)

    const response = await traccarClient.post('/api/devices', deviceData)

    console.log('✅ Máquina criada com sucesso:', response.data)

    return NextResponse.json({
      success: true,
      data: response.data
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro ao criar máquina:', message)

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    )
  }
}
