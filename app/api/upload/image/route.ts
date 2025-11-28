import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de arquivo não suportado. Use JPG, PNG, WEBP ou GIF.'
        },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo muito grande. Tamanho máximo: 5MB.'
        },
        { status: 400 }
      )
    }

    // Gerar nome único
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Converter File para ArrayBuffer e depois para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('machine-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erro no upload do Supabase:', error)
      return NextResponse.json(
        { success: false, error: `Erro ao fazer upload: ${error.message}` },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('machine-images')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: fileName
    })

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}
