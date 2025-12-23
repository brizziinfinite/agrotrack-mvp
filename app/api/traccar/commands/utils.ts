const TRACCAR_URL = (process.env.TRACCAR_URL || process.env.NEXT_PUBLIC_TRACCAR_URL || "").replace(/\/+$/, "")
const TRACCAR_USER = process.env.TRACCAR_USER || process.env.TRACCAR_EMAIL
const TRACCAR_PASS = process.env.TRACCAR_PASS || process.env.TRACCAR_PASSWORD

if (!TRACCAR_URL || !TRACCAR_USER || !TRACCAR_PASS) {
  throw new Error("Variáveis de ambiente do Traccar não configuradas.")
}

const authHeader = `Basic ${Buffer.from(`${TRACCAR_USER}:${TRACCAR_PASS}`).toString("base64")}`

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`)

async function traccarFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${TRACCAR_URL}${normalizePath(path)}`, {
    ...init,
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "Erro ao comunicar com o Traccar.")
  }

  return response.json()
}

export async function findSavedCommand(keywords: string[]) {
  const commands = await traccarFetch("/api/commands")
  if (!Array.isArray(commands)) return null
  const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase())
  return (
    commands.find((cmd: Record<string, unknown>) => {
      const target = `${(cmd.name as string) || ""} ${(cmd.description as string) || ""} ${(cmd.type as string) || ""}`.toLowerCase()
      return lowerKeywords.some((keyword) => target.includes(keyword))
    }) || null
  )
}

export async function sendSavedCommand(commandId: number, deviceId: number) {
  if (!commandId) throw new Error("Comando inválido.")
  return traccarFetch("/api/commands/send", {
    method: "POST",
    body: JSON.stringify({ id: commandId, deviceId }),
  })
}

export async function sendCommandType(type: string, deviceId: number) {
  return traccarFetch("/api/commands/send", {
    method: "POST",
    body: JSON.stringify({ type, deviceId }),
  })
}
