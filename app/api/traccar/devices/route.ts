import { NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    const TRACCAR_URL = 'http://178.156.176.177:8082'
    const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
    const TRACCAR_PASSWORD = 'a202595B'

    console.log('🔍 Conectando no Traccar...')

    // Criar autenticação
    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }

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