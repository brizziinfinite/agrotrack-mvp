import { NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const TRACCAR_URL = 'http://178.156.176.177:8082'
const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
const TRACCAR_PASSWORD = 'a202595B'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, uniqueId, phone, metadata } = body

    console.log('📝 Criando novo rastreador:', name)

    // 1. Criar autenticação do Traccar
    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 2. Criar dispositivo no Traccar
    console.log('🔄 Criando dispositivo no Traccar...')
    const traccarDevice = {
      name,
      uniqueId,
      phone: phone || undefined,
      category: 'default',
      model: metadata?.modelo || undefined
    }

    const traccarResponse = await axios.post(
      `${TRACCAR_URL}/api/devices`,
      traccarDevice,
      { headers }
    )

    const deviceId = traccarResponse.data.id
    console.log(`✅ Dispositivo criado no Traccar com ID: ${deviceId}`)

    // 3. Salvar metadados no Supabase
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('💾 Salvando metadados no Supabase...')

      const { data, error } = await supabase
        .from('device_metadata')
        .insert({
          device_id: deviceId,
          traccar_unique_id: uniqueId,
          name,
          descricao: metadata.descricao || null,
          icone: metadata.icone || '🚜',
          cor: metadata.cor || '#10b981',
          foto: metadata.foto || null,
          tipo: metadata.tipo || 'veiculo',
          placa: metadata.placa || null,
          marca: metadata.marca || null,
          modelo: metadata.modelo || null,
          ano: metadata.ano || null,
          raca: metadata.raca || null,
          idade: metadata.idade || null,
          peso: metadata.peso || null,
          numero_serie: metadata.numeroSerie || null,
          fornecedor: metadata.fornecedor || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erro ao salvar metadados no Supabase:', error)
        // Não retornar erro, pois o dispositivo já foi criado no Traccar
        console.log('⚠️  Dispositivo criado no Traccar, mas metadados não foram salvos')
      } else {
        console.log('✅ Metadados salvos no Supabase')
      }
    }

    return NextResponse.json({
      success: true,
      device: {
        id: deviceId,
        name,
        uniqueId,
        ...traccarResponse.data
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar rastreador:', error)

    // Tratamento de erros específicos do Traccar
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.response.data

      if (status === 400) {
        return NextResponse.json(
          {
            success: false,
            error: 'Dados inválidos. Verifique se o IMEI já não está cadastrado.'
          },
          { status: 400 }
        )
      }

      if (status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: 'Erro de autenticação com o Traccar. Contate o suporte.'
          },
          { status: 500 }
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
        error: error.message || 'Erro ao criar rastreador'
      },
      { status: 500 }
    )
  }
}
