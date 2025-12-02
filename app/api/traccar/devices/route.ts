import { NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const TRACCAR_URL = 'http://178.156.176.177:8082'
const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
const TRACCAR_PASSWORD = 'a202595B'

const getTraccarHeaders = () => {
  const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

export async function GET() {
  try {
    console.log('🔍 Conectando no Traccar...')

    const headers = getTraccarHeaders()

    // Buscar dispositivos
    const devicesResponse = await axios.get(`${TRACCAR_URL}/api/devices`, { headers })
    const devices = devicesResponse.data

    console.log(`✅ Encontrados ${devices.length} dispositivos`)

    // Buscar posições
    let positions = []
    try {
      const positionsResponse = await axios.get(`${TRACCAR_URL}/api/positions`, { headers })
      positions = positionsResponse.data
      console.log(`✅ Encontradas ${positions.length} posições`)
    } catch (e) {
      console.log('⚠️  Sem posições disponíveis')
    }

    // Buscar metadados do Supabase
    let metadata: Record<number, any> = {}
    try {
      const { data: metadataData, error } = await supabase
        .from('device_metadata')
        .select('*')

      if (!error && metadataData) {
        metadata = metadataData.reduce((acc: any, item: any) => {
          acc[item.device_id] = item
          return acc
        }, {})
        console.log(`✅ Encontrados ${metadataData.length} metadados no Supabase`)
      }
    } catch (e) {
      console.log('⚠️  Erro ao buscar metadados do Supabase')
    }

    // Combinar dados
    const positionsMap = new Map(positions.map((p: any) => [p.deviceId, p]))

    const result = devices.map((device: any) => {
      const deviceMetadata = metadata[device.id] || {}

      return {
        id: device.id,
        name: device.name,
        uniqueId: device.uniqueId,
        status: device.status,
        lastUpdate: device.lastUpdate,
        position: positionsMap.get(device.id) || null,
        // Metadados personalizados
        metadata: {
          icone: deviceMetadata.icone || '🚜',
          cor: deviceMetadata.cor || '#10b981',
          foto: deviceMetadata.foto || null,
          descricao: deviceMetadata.descricao || null,
          tipo: deviceMetadata.tipo || 'veiculo',
          placa: deviceMetadata.placa || null,
          marca: deviceMetadata.marca || null,
          modelo: deviceMetadata.modelo || null,
          ano: deviceMetadata.ano || null,
          raca: deviceMetadata.raca || null,
          idade: deviceMetadata.idade || null,
          peso: deviceMetadata.peso || null,
          numeroSerie: deviceMetadata.numero_serie || null,
          fornecedor: deviceMetadata.fornecedor || null
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('❌ Erro:', error.message)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, uniqueId, category } = body

    console.log(`📝 Criando dispositivo: ${name} (${uniqueId})`)

    if (!name || !uniqueId) {
      return NextResponse.json(
        { success: false, error: 'Nome e IMEI são obrigatórios' },
        { status: 400 }
      )
    }

    const headers = getTraccarHeaders()

    // Create device in Traccar
    const deviceData = {
      name,
      uniqueId,
      category: category || 'default',
      attributes: {
        speedConfig: { low: 8, ideal: 18, high: 30 },
        paymentStatus: 'active'
      }
    }

    const response = await axios.post(
      `${TRACCAR_URL}/api/devices`,
      deviceData,
      { headers }
    )

    console.log(`✅ Dispositivo criado no Traccar: ID ${response.data.id}`)

    return NextResponse.json({
      success: true,
      device: response.data
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar dispositivo:', error.message)

    // Handle Traccar-specific errors
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.response.data

      if (status === 400) {
        return NextResponse.json(
          {
            success: false,
            error: 'IMEI já cadastrado ou dados inválidos'
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `Erro do Traccar: ${message}`
        },
        { status: status }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao criar dispositivo'
      },
      { status: 500 }
    )
  }
}