import { NextRequest, NextResponse } from "next/server"
import { traccarClient } from "@/lib/traccar"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const deviceId = Number(resolved.id)
    if (Number.isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "ID inválido." }, { status: 400 })
    }

    const [devicesResponse, positionsResponse] = await Promise.all([
      traccarClient.get("/api/devices"),
      traccarClient.get("/api/positions"),
    ])

    const device = (devicesResponse.data as any[]).find((d) => d.id === deviceId)
    if (!device) {
      return NextResponse.json({ success: false, error: "Dispositivo não encontrado." }, { status: 404 })
    }

    const position = (positionsResponse.data as any[]).find((p) => p.deviceId === deviceId) || null
    return NextResponse.json({ success: true, data: { ...device, position } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar dispositivo."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
