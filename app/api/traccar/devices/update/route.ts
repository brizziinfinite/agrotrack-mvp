import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, uniqueId, category, model, m2m, plate, color, speedIdealMax, speedHighMax, speedExtremeName } = body

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
    const attributes: any = {}
    if (m2m) attributes.m2m = m2m
    if (plate) attributes.plate = plate
    if (color) attributes.color = color
    if (speedIdealMax) attributes.speedIdealMax = Number(speedIdealMax)
    if (speedHighMax) attributes.speedHighMax = Number(speedHighMax)
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

  } catch (error: any) {
    console.error('❌ Erro ao atualizar máquina:', error.response?.data || error.message)

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message
      },
      { status: 500 }
    )
  }
}
