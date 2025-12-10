import { NextResponse } from 'next/server'
import { traccarClient } from '@/lib/traccar'

type FenceType = 'polygon' | 'circle' | 'polyline'

interface FenceShape {
  type: FenceType
  coordinates: [number, number][]
  radius?: number
}

interface CreateGeofenceRequest {
  name: string
  description?: string
  deviceId: number
  shape: FenceShape
}

function polygonToWkt(coordinates: [number, number][]) {
  if (coordinates.length < 3) {
    throw new Error('Polígono precisa ter pelo menos 3 pontos')
  }

  const closed = [...coordinates]
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closed.push(first)
  }

  const pointsWkt = closed.map(([lat, lng]) => `${lng} ${lat}`).join(', ')
  return `POLYGON ((${pointsWkt}))`
}

function circleToWkt(coordinates: [number, number][], radius?: number) {
  if (!radius || radius <= 0) {
    throw new Error('Raio inválido para círculo')
  }
  const [lat, lng] = coordinates[0]
  return `CIRCLE (${lng} ${lat}, ${radius})`
}

export async function POST(request: Request) {
  try {
    const body: CreateGeofenceRequest = await request.json()
    const { name, description, deviceId, shape } = body

    if (!name || !deviceId || !shape || !shape.type || !shape.coordinates?.length) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: name, deviceId e shape' },
        { status: 400 }
      )
    }

    let area = ''
    if (shape.type === 'circle') {
      area = circleToWkt(shape.coordinates, shape.radius)
    } else {
      // Para "lápis"/polyline convertemos em polígono fechando a forma
      area = polygonToWkt(shape.coordinates)
    }

    const geofencePayload = {
      name,
      description: description || '',
      area,
      attributes: {}
    }

    const geofenceResponse = await traccarClient.post('/api/geofences', geofencePayload)
    const geofenceId = geofenceResponse.data.id

    await traccarClient.post('/api/permissions', {
      deviceId,
      geofenceId
    })

    return NextResponse.json({
      success: true,
      data: { geofenceId }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar cerca virtual'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
