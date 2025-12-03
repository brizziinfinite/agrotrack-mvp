/* ARQUIVO 100% CORRIGIDO — COLE TUDO */

import axios from 'axios'

const TRACCAR_URL = process.env.NEXT_PUBLIC_TRACCAR_URL!
const TRACCAR_EMAIL = process.env.TRACCAR_EMAIL!
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD!

// Autenticação Basic
const auth = Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64')

export const traccarClient = axios.create({
  baseURL: TRACCAR_URL,
  headers: {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Tipos TypeScript -----------------------------

export interface TraccarDevice {
  id: number
  name: string
  uniqueId: string
  status: 'online' | 'offline' | 'unknown'
  lastUpdate: string
  positionId: number
  category?: string
  model?: string
  disabled: boolean
}

export interface TraccarPosition {
  id: number
  deviceId: number
  protocol: string
  deviceTime: string
  fixTime: string
  serverTime: string
  valid: boolean
  latitude: number
  longitude: number
  altitude: number
  speed: number
  course: number
  address?: string
  accuracy: number
  attributes: {
    batteryLevel?: number
    distance?: number
    totalDistance?: number
    motion?: boolean
    ignition?: boolean
    hours?: number
    [key: string]: unknown   // <<< CORRIGIDO — sem ANY
  }
}

// Funções helper -----------------------------

export async function getDevices(): Promise<TraccarDevice[]> {
  const response = await traccarClient.get<TraccarDevice[]>('/api/devices')
  return response.data
}

export async function getPositions(deviceIds?: number[]): Promise<TraccarPosition[]> {
  let url = '/api/positions'
  if (deviceIds && deviceIds.length > 0) {
    url += `?deviceId=${deviceIds.join(',')}`
  }

  const response = await traccarClient.get<TraccarPosition[]>(url)
  return response.data
}

export async function getDevicePosition(deviceId: number): Promise<TraccarPosition | null> {
  try {
    const positions = await getPositions([deviceId])
    return positions[0] ?? null
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error fetching device position:', err.message)
    } else {
      console.error('Unknown error fetching device position')
    }
    return null
  }
}
