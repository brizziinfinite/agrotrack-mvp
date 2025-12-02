import { NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const TRACCAR_URL = 'http://178.156.176.177:8082'
const TRACCAR_EMAIL = 'brizziinfinite@gmail.com'
const TRACCAR_PASSWORD = 'a202595B'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET - Buscar dados de um dispositivo específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deviceId = parseInt(id)

    console.log(`🔍 Buscando dispositivo ID: ${deviceId}`)

    // 1. Criar autenticação do Traccar
    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 2. Buscar dispositivo no Traccar
    const traccarResponse = await axios.get(
      `${TRACCAR_URL}/api/devices?id=${deviceId}`,
      { headers }
    )

    if (!traccarResponse.data || traccarResponse.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dispositivo não encontrado' },
        { status: 404 }
      )
    }

    const device = traccarResponse.data[0]
    console.log(`✅ Dispositivo encontrado: ${device.name}`)

    // 3. Buscar metadados no Supabase
    const { data: metadata, error } = await supabase
      .from('device_metadata')
      .select('*')
      .eq('device_id', deviceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar metadados:', error)
    }

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        metadata: metadata || null
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar dispositivo:', error)

    if (error.response?.status === 404) {
      return NextResponse.json(
        { success: false, error: 'Dispositivo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar dispositivo'
      },
      { status: 500 }
    )
  }
}

// PUT - Atualizar dados de um dispositivo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deviceId = parseInt(id)
    const body = await request.json()
    const { name, uniqueId, phone, metadata } = body

    console.log(`📝 Atualizando dispositivo ID: ${deviceId}`)

    // 1. Criar autenticação do Traccar
    const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 2. Buscar dispositivo atual no Traccar para preservar dados existentes
    const currentDeviceResponse = await axios.get(
      `${TRACCAR_URL}/api/devices?id=${deviceId}`,
      { headers }
    )

    if (!currentDeviceResponse.data || currentDeviceResponse.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dispositivo não encontrado' },
        { status: 404 }
      )
    }

    const currentDevice = currentDeviceResponse.data[0]

    // 3. Preparar dados atualizados para o Traccar
    const updatedDevice = {
      ...currentDevice,
      id: deviceId,
      name: name || currentDevice.name,
      uniqueId: uniqueId || currentDevice.uniqueId,
      phone: phone !== undefined ? phone : currentDevice.phone,
      category: currentDevice.category,
      model: metadata?.modelo || currentDevice.model,
      attributes: {
        ...currentDevice.attributes,
        speedConfig: metadata?.speedConfig || currentDevice.attributes?.speedConfig || { low: 8, ideal: 18, high: 30 },
        paymentStatus: metadata?.paymentStatus || currentDevice.attributes?.paymentStatus || 'active'
      }
    }

    // 4. Atualizar dispositivo no Traccar
    console.log('🔄 Atualizando dispositivo no Traccar...')
    const traccarResponse = await axios.put(
      `${TRACCAR_URL}/api/devices/${deviceId}`,
      updatedDevice,
      { headers }
    )

    console.log(`✅ Dispositivo atualizado no Traccar`)

    // 5. Atualizar metadados no Supabase
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('💾 Atualizando metadados no Supabase...')

      // Verificar se já existe registro de metadata
      const { data: existingMetadata } = await supabase
        .from('device_metadata')
        .select('*')
        .eq('device_id', deviceId)
        .single()

      const metadataToSave = {
        device_id: deviceId,
        traccar_unique_id: uniqueId || currentDevice.uniqueId,
        name: name || currentDevice.name,
        descricao: metadata.descricao !== undefined ? metadata.descricao : existingMetadata?.descricao,
        icone: metadata.icone !== undefined ? metadata.icone : existingMetadata?.icone || '🚜',
        cor: metadata.cor !== undefined ? metadata.cor : existingMetadata?.cor || '#10b981',
        foto: metadata.foto !== undefined ? metadata.foto : existingMetadata?.foto,
        tipo: metadata.tipo !== undefined ? metadata.tipo : existingMetadata?.tipo || 'veiculo',
        placa: metadata.placa !== undefined ? metadata.placa : existingMetadata?.placa,
        marca: metadata.marca !== undefined ? metadata.marca : existingMetadata?.marca,
        modelo: metadata.modelo !== undefined ? metadata.modelo : existingMetadata?.modelo,
        ano: metadata.ano !== undefined ? metadata.ano : existingMetadata?.ano,
        raca: metadata.raca !== undefined ? metadata.raca : existingMetadata?.raca,
        idade: metadata.idade !== undefined ? metadata.idade : existingMetadata?.idade,
        peso: metadata.peso !== undefined ? metadata.peso : existingMetadata?.peso,
        numero_serie: metadata.numeroSerie !== undefined ? metadata.numeroSerie : existingMetadata?.numero_serie,
        fornecedor: metadata.fornecedor !== undefined ? metadata.fornecedor : existingMetadata?.fornecedor,
        updated_at: new Date().toISOString()
      }

      let result
      if (existingMetadata) {
        // Atualizar registro existente
        result = await supabase
          .from('device_metadata')
          .update(metadataToSave)
          .eq('device_id', deviceId)
      } else {
        // Criar novo registro
        result = await supabase
          .from('device_metadata')
          .insert({
            ...metadataToSave,
            created_at: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('❌ Erro ao atualizar metadados no Supabase:', result.error)
        // Não retornar erro, pois o dispositivo já foi atualizado no Traccar
        console.log('⚠️  Dispositivo atualizado no Traccar, mas metadados não foram salvos')
      } else {
        console.log('✅ Metadados atualizados no Supabase')
      }
    }

    return NextResponse.json({
      success: true,
      device: {
        id: deviceId,
        name: updatedDevice.name,
        uniqueId: updatedDevice.uniqueId,
        ...traccarResponse.data
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao atualizar dispositivo:', error)

    // Tratamento de erros específicos do Traccar
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.response.data

      if (status === 400) {
        return NextResponse.json(
          {
            success: false,
            error: 'Dados inválidos. Verifique se o IMEI já não está cadastrado em outro dispositivo.'
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

      if (status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Dispositivo não encontrado'
          },
          { status: 404 }
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
        error: error.message || 'Erro ao atualizar dispositivo'
      },
      { status: 500 }
    )
  }
}
