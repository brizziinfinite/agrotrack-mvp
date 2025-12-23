import { NextRequest, NextResponse } from "next/server"
import { traccarClient } from "@/lib/traccar"

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido." }, { status: 400 })
    }

    await traccarClient.delete(`/api/geofences/${id}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao remover a cerca."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
