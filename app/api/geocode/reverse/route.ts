import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros lat e lon são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar OpenStreetMap Nominatim para reverse geocoding
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          format: 'json',
          lat,
          lon,
          zoom: 18,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'AgroTrack/1.0'
        }
      }
    )

    const data = response.data

    // Formatar endereço de forma legível
    let address = ''
    if (data.address) {
      const parts = []

      if (data.address.road) parts.push(data.address.road)
      if (data.address.house_number) parts.push(data.address.house_number)
      if (data.address.suburb || data.address.neighbourhood) {
        parts.push(data.address.suburb || data.address.neighbourhood)
      }
      if (data.address.city || data.address.town || data.address.village) {
        parts.push(data.address.city || data.address.town || data.address.village)
      }
      if (data.address.state) parts.push(data.address.state)

      address = parts.join(', ')
    }

    return NextResponse.json({
      success: true,
      address: address || data.display_name || 'Endereço não disponível',
      details: data.address
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar endereço:', error.message)

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar endereço',
        address: 'Endereço não disponível'
      },
      { status: 500 }
    )
  }
}
