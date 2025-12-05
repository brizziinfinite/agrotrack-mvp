import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

export async function POST(request: Request) {
  try {
    const body = await request.json()
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
    const attributes: any = {}
    if (m2m) attributes.m2m = m2m
    if (plate) attributes.plate = plate
    if (color) attributes.color = color
    if (iccid) attributes.iccid = iccid
    if (speedIdealMax) attributes.speedIdealMax = Number(speedIdealMax)
    if (speedHighMax) attributes.speedHighMax = Number(speedHighMax)
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

  } catch (error: any) {
    console.error('❌ Erro ao criar máquina:', error.response?.data || error.message)

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message
      },
      { status: 500 }
    )
  }
}
