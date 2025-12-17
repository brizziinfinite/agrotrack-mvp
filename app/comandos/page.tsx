"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TraccarCommand, TraccarCommandType } from "@/lib/traccar"
import { Loader2, Radio, RefreshCw, Save, Send, SmartphoneNfc } from "lucide-react"

type DeviceOption = {
  id: number
  name: string
  status: string
  uniqueId?: string
  phone?: string
  category?: string
}

type CommandLogItem = {
  id: string
  deviceName: string
  type: string
  channel: string
  createdAt: string
  status: "success" | "error"
  message?: string
}

const parseJsonAttributes = (value: string): Record<string, unknown> | undefined => {
  if (!value.trim()) return undefined
  const trimmed = value.trim()
  if (trimmed === "{}") return {}
  return JSON.parse(trimmed)
}

export default function ComandosPage() {
  const [devices, setDevices] = useState<DeviceOption[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [devicesError, setDevicesError] = useState<string | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")

  const [textChannel, setTextChannel] = useState(false)
  const [commandTypes, setCommandTypes] = useState<TraccarCommandType[]>([])
  const [commandTypesLoading, setCommandTypesLoading] = useState(false)
  const [commandTypesError, setCommandTypesError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>("")

  const [savedCommands, setSavedCommands] = useState<TraccarCommand[]>([])
  const [savedCommandsLoading, setSavedCommandsLoading] = useState(false)
  const [savedCommandsError, setSavedCommandsError] = useState<string | null>(null)

  const [attributesInput, setAttributesInput] = useState('{\n  "data": ""\n}')
  const [attributesError, setAttributesError] = useState<string | null>(null)

  const [sending, setSending] = useState(false)
  const [sendFeedback, setSendFeedback] = useState<string | null>(null)
  const [sendLog, setSendLog] = useState<CommandLogItem[]>([])

  const loadDevices = useCallback(async () => {
    setDevicesLoading(true)
    setDevicesError(null)
    try {
      const response = await fetch("/api/traccar/devices")
      const result = await response.json()
      if (result.success) {
        const list = result.data as DeviceOption[]
        setDevices(list)
        if (!selectedDeviceId && list.length > 0) {
          setSelectedDeviceId(String(list[0].id))
        }
      } else {
        setDevicesError(result.error || "Falha ao carregar dispositivos")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao carregar dispositivos"
      setDevicesError(message)
    } finally {
      setDevicesLoading(false)
    }
  }, [selectedDeviceId])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  const fetchCommandTypes = useCallback(async () => {
    if (!selectedDeviceId) {
      setCommandTypes([])
      setSelectedType("")
      return
    }
    setCommandTypesLoading(true)
    setCommandTypesError(null)
    try {
      const params = new URLSearchParams()
      params.set("deviceId", selectedDeviceId)
      params.set("textChannel", textChannel ? "true" : "false")
      const response = await fetch(`/api/traccar/commands/types?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        const list = (result.data as TraccarCommandType[]) || []
        setCommandTypes(list)
        if (list.length > 0) {
          if (!list.find((item) => item.type === selectedType)) {
            setSelectedType(list[0].type)
          }
        } else {
          setSelectedType("")
        }
      } else {
        setCommandTypesError(result.error || "Não foi possível carregar os tipos")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar tipos de comando"
      setCommandTypesError(message)
    } finally {
      setCommandTypesLoading(false)
    }
  }, [selectedDeviceId, textChannel, selectedType])

  useEffect(() => {
    fetchCommandTypes()
  }, [fetchCommandTypes])

  const fetchSavedCommands = useCallback(async () => {
    if (!selectedDeviceId) {
      setSavedCommands([])
      return
    }
    setSavedCommandsLoading(true)
    setSavedCommandsError(null)
    try {
      const response = await fetch(`/api/traccar/commands?deviceId=${selectedDeviceId}`)
      const result = await response.json()
      if (result.success) {
        setSavedCommands(result.data as TraccarCommand[])
      } else {
        setSavedCommandsError(result.error || "Não foi possível listar comandos salvos")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar comandos salvos"
      setSavedCommandsError(message)
    } finally {
      setSavedCommandsLoading(false)
    }
  }, [selectedDeviceId])

  useEffect(() => {
    fetchSavedCommands()
  }, [fetchSavedCommands])

  const selectedDevice = useMemo(() => {
    return devices.find((device) => String(device.id) === selectedDeviceId)
  }, [devices, selectedDeviceId])

  const handleSendCommand = async () => {
    if (!selectedDeviceId || !selectedType) return
    let attributes: Record<string, unknown> | undefined
    setAttributesError(null)
    setSendFeedback(null)

    try {
      attributes = parseJsonAttributes(attributesInput)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Formato inválido. Use JSON válido."
      setAttributesError(message)
      return
    }

    const payload: TraccarCommand = {
      deviceId: Number(selectedDeviceId),
      type: selectedType,
      textChannel,
      attributes,
    }

    setSending(true)
    try {
      const response = await fetch("/api/traccar/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (result.success) {
        setSendFeedback("Comando enviado para a fila do Traccar.")
        setSendLog((prev) => [
          {
            id: crypto.randomUUID(),
            deviceName: selectedDevice?.name || `ID ${selectedDeviceId}`,
            type: selectedType,
            channel: textChannel ? "SMS" : "Dados",
            createdAt: new Date().toISOString(),
            status: "success",
          },
          ...prev.slice(0, 9),
        ])
      } else {
        setSendFeedback(result.error || "Envio recusado pelo Traccar")
        setSendLog((prev) => [
          {
            id: crypto.randomUUID(),
            deviceName: selectedDevice?.name || `ID ${selectedDeviceId}`,
            type: selectedType,
            channel: textChannel ? "SMS" : "Dados",
            createdAt: new Date().toISOString(),
            status: "error",
            message: result.error,
          },
          ...prev.slice(0, 9),
        ])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar comando"
      setSendFeedback(message)
      setSendLog((prev) => [
        {
          id: crypto.randomUUID(),
          deviceName: selectedDevice?.name || `ID ${selectedDeviceId}`,
          type: selectedType,
          channel: textChannel ? "SMS" : "Dados",
          createdAt: new Date().toISOString(),
          status: "error",
          message,
        },
        ...prev.slice(0, 9),
      ])
    } finally {
      setSending(false)
    }
  }

  const handleSendSavedCommand = async (commandId: number) => {
    if (!selectedDeviceId) return
    setSendFeedback(null)
    setSending(true)
    try {
      const response = await fetch("/api/traccar/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: commandId,
          deviceId: Number(selectedDeviceId),
        }),
      })
      const result = await response.json()
      if (result.success) {
        setSendFeedback(`Comando #${commandId} enviado`)
        const saved = savedCommands.find((item) => item.id === commandId)
        setSendLog((prev) => [
          {
            id: crypto.randomUUID(),
            deviceName: selectedDevice?.name || `ID ${selectedDeviceId}`,
            type: saved?.type || "saved",
            channel: saved?.textChannel ? "SMS" : "Dados",
            createdAt: new Date().toISOString(),
            status: "success",
          },
          ...prev.slice(0, 9),
        ])
      } else {
        setSendFeedback(result.error || "Falha ao enviar comando salvo")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao acionar comando salvo"
      setSendFeedback(message)
    } finally {
      setSending(false)
    }
  }

  const deviceStatusBadge = (status: string) => {
    if (status === "online") return "text-emerald-300 bg-emerald-500/10 border border-emerald-400/30"
    if (status === "offline") return "text-rose-300 bg-rose-500/10 border border-rose-400/30"
    return "text-slate-300 bg-white/5 border border-white/10"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050816] via-[#050816] to-[#030412] text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400/80">TRACCAR</p>
          <h1 className="text-3xl font-semibold text-slate-50">Comandos remotos</h1>
          <p className="text-sm text-slate-400">
            Envie instruções diretamente para os rastreadores via API (`/api/commands` e `/api/commands/send`).
          </p>
        </div>

        <Card className="border-none bg-white/5 backdrop-blur rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Dispositivo alvo e tipo</CardTitle>
            <CardDescription className="text-slate-300">
              O Next.js consulta o Traccar para listar devices, tipos suportados e envio direto de comandos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {devicesError && <p className="text-sm text-rose-300">{devicesError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Dispositivo</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-100"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={devicesLoading}
                >
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      #{device.id} · {device.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Canal</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={textChannel ? "secondary" : "default"}
                    className={cn(
                      "border border-white/10 bg-white/5 text-slate-100",
                      !textChannel && "bg-emerald-500/20 text-emerald-100 border-emerald-500/20"
                    )}
                    onClick={() => setTextChannel(false)}
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Dados
                  </Button>
                  <Button
                    type="button"
                    variant={textChannel ? "default" : "secondary"}
                    className={cn(
                      "border border-white/10 bg-white/5 text-slate-100",
                      textChannel && "bg-amber-500/20 text-amber-100 border-amber-500/30"
                    )}
                    onClick={() => setTextChannel(true)}
                  >
                    <SmartphoneNfc className="h-4 w-4 mr-2" />
                    SMS
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Tipo de comando suportado</label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:text-white"
                  onClick={fetchCommandTypes}
                  disabled={commandTypesLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
              </div>
              {commandTypesError && <p className="text-xs text-rose-300">{commandTypesError}</p>}
              <select
                className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-100"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={commandTypesLoading || commandTypes.length === 0}
              >
                {commandTypes.map((type) => (
                  <option key={type.type} value={type.type}>
                    {type.type}
                  </option>
                ))}
              </select>
              {commandTypes.length === 0 && !commandTypesLoading && (
                <p className="text-xs text-slate-400">O Traccar não retornou tipos para este dispositivo/canal.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Atributos (JSON)</label>
              <textarea
                className="w-full min-h-[150px] rounded-xl border border-white/10 bg-[#0f172a] p-3 font-mono text-sm text-slate-100"
                value={attributesInput}
                onChange={(e) => setAttributesInput(e.target.value)}
              />
              {attributesError && <p className="text-xs text-rose-400">{attributesError}</p>}
              <p className="text-xs text-slate-400">
                Use o formato esperado pelo comando. Exemplo (Custom): {"{\"data\":\"0055\"}"}. Para campos vazios, deixe
                um objeto vazio.
              </p>
            </div>

            {sendFeedback && (
              <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                {sendFeedback}
              </p>
            )}

            <Button
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              onClick={handleSendCommand}
              disabled={sending || !selectedDeviceId || !selectedType}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar comando
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none bg-white/5 rounded-2xl lg:col-span-2">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg text-white">Comandos salvos (Traccar)</CardTitle>
                <CardDescription className="text-slate-300">
                  Endpoint `/api/commands?deviceId=ID` — clique para disparar rapidamente usando as preferências cadastradas no servidor.
                </CardDescription>
              </div>
              <Badge className="bg-white/10 border border-white/20 text-slate-200">
                {savedCommands.length} comandos
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedCommandsError && <p className="text-sm text-rose-300">{savedCommandsError}</p>}
              {savedCommandsLoading && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando comandos salvos...
                </div>
              )}
              {!savedCommandsLoading && savedCommands.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum comando salvo para este dispositivo.</p>
              )}
              <div className="space-y-3">
                {savedCommands.map((command) => (
                  <div
                    key={command.id}
                    className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        #{command.id} · {command.type}
                      </p>
                      <p className="text-xs text-slate-400">{command.description || "Sem descrição"}</p>
                      {command.textChannel !== undefined && (
                        <p className="text-[11px] text-slate-500">
                          Canal: {command.textChannel ? "SMS" : "Dados"}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-slate-100"
                      onClick={() => handleSendSavedCommand(command.id!)}
                      disabled={sending || !selectedDeviceId}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enviar salvo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Status do dispositivo</CardTitle>
              <CardDescription className="text-slate-300">
                Informações básicas retornadas pelo `/api/traccar/devices`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDevice ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedDevice.name}</p>
                    <p className="text-xs text-slate-400">Unique ID: {selectedDevice.uniqueId}</p>
                  </div>
                  <Badge className={cn("w-fit px-2 py-1 text-xs", deviceStatusBadge(selectedDevice.status))}>
                    {selectedDevice.status}
                  </Badge>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Categoria: {selectedDevice.category || "—"}</p>
                    <p>Telefone SMS: {selectedDevice.phone || "—"}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">Selecione um dispositivo para ver detalhes.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-white/5 rounded-2xl">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg text-white">Envios recentes (sessão atual)</CardTitle>
              <CardDescription className="text-slate-300">
                Registro local rápido para acompanhar o que foi enviado ao `/api/commands/send`.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sendLog.length === 0 && <p className="text-sm text-slate-400">Ainda não há envios.</p>}
            <div className="space-y-3">
              {sendLog.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 gap-2"
                >
                  <div>
                    <p className="text-sm text-white">
                      {log.deviceName} · {log.type} ({log.channel})
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString("pt-BR")} · {log.status === "success" ? "OK" : "Erro"}
                    </p>
                    {log.message && <p className="text-xs text-rose-300">{log.message}</p>}
                  </div>
                  <Badge
                    className={cn(
                      "w-fit px-3 py-1 text-xs",
                      log.status === "success"
                        ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-100 border border-rose-500/30"
                    )}
                  >
                    {log.status === "success" ? "enviado" : "erro"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
