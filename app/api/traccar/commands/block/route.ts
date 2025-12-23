import { NextRequest, NextResponse } from "next/server"
import { findSavedCommand, sendCommandType, sendSavedCommand } from "../../commands/utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const deviceId = Number(body?.deviceId)
    if (Number.isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "Informe um deviceId válido." }, { status: 400 })
    }

    const command = await findSavedCommand(["bloquear", "engine stop", "enginestop"])
    if (command?.id) {
      await sendSavedCommand(command.id, deviceId)
    } else {
      await sendCommandType("engineStop", deviceId)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar comando de bloqueio."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
