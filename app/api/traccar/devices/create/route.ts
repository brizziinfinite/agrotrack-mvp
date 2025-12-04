import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, uniqueId, category, model, m2m, plate, color } = body

    if (!name || !uniqueId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome e IMEI são obrigatórios'
        },
        { status: 400 }
      )
    }

    const TRACCAR_URL = 'http://178.156.176.177:8082'
    const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
    const TRACCAR_PASSWORD = 'a202595B'

    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // Criar attributes com dados extras
    const attributes: any = {}
    if (m2m) attributes.m2m = m2m
    if (plate) attributes.plate = plate
    if (color) attributes.color = color

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

    const response = await axios.post(
      `${TRACCAR_URL}/api/devices`,
      deviceData,
      { headers }
    )

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