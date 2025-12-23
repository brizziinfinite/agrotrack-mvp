import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const deviceId = Number(resolved.id)
    if (Number.isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "ID inválido." }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("device_events_summary")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data: data || {
        over_speed_count: 0,
        over_speed_duration_minutes: 0,
        harsh_brake_count: 0,
        harsh_turn_count: 0,
        engine_rotation: null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar estatísticas do dispositivo."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
