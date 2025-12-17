"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { TraccarComputedAttribute } from "@/lib/traccar"
import { AlertCircle, Box, Loader2, PlusCircle, RefreshCw, Unlink2 } from "lucide-react"

interface DeviceOption {
  id: number
  name: string
}

const ATTRIBUTE_TYPES = [
  { value: "number", label: "Número" },
  { value: "string", label: "Texto" },
  { value: "boolean", label: "Booleano" },
]

const initialForm = {
  description: "",
  attribute: "",
  expression: "",
  type: "number",
  priority: "0",
}

export default function ComputedAttributesPage() {
  const [attributes, setAttributes] = useState<TraccarComputedAttribute[]>([])
  const [devices, setDevices] = useState<DeviceOption[]>([])
  const [form, setForm] = useState(initialForm)
  const [loadingAttributes, setLoadingAttributes] = useState(true)
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [selectedDeviceForAttr, setSelectedDeviceForAttr] = useState<Record<number, string>>({})

  const fetchAttributes = useCallback(async () => {
    setLoadingAttributes(true)
    setError(null)
    try {
      const response = await fetch("/api/traccar/computed-attributes")
      const result = await response.json()
      if (result.success) {
        setAttributes(result.data as TraccarComputedAttribute[])
      } else {
        setError(result.error || "Não foi possível carregar atributos computados.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao consultar atributos."
      setError(message)
    } finally {
      setLoadingAttributes(false)
    }
  }, [])

  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true)
    try {
      const response = await fetch("/api/traccar/devices")
      const result = await response.json()
      if (result.success) {
        setDevices((result.data as DeviceOption[]).map((d) => ({ id: d.id, name: d.name })))
      }
    } catch {
      // Silencioso, a página continua funcional sem lista de devices
    } finally {
      setLoadingDevices(false)
    }
  }, [])

  useEffect(() => {
    fetchAttributes()
    fetchDevices()
  }, [fetchAttributes, fetchDevices])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setActionMessage(null)
    try {
      const payload = {
        description: form.description.trim(),
        attribute: form.attribute.trim(),
        expression: form.expression.trim(),
        type: form.type,
        priority: Number(form.priority) || 0,
      }

      const response = await fetch("/api/traccar/computed-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (result.success) {
        setForm(initialForm)
        setActionMessage("Atributo criado com sucesso.")
        fetchAttributes()
      } else {
        setActionMessage(result.error || "Falha ao criar atributo.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro de rede ao criar atributo."
      setActionMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    setActionMessage(null)
    try {
      const response = await fetch(`/api/traccar/computed-attributes/${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (result.success) {
        setActionMessage("Atributo removido.")
        setSelectedDeviceForAttr((prev) => ({ ...prev, [id]: "" }))
        fetchAttributes()
      } else {
        setActionMessage(result.error || "Não foi possível remover.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover atributo."
      setActionMessage(message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleLink = async (attributeId: number, mode: "link" | "unlink") => {
    const selectedDevice = selectedDeviceForAttr[attributeId]
    if (!selectedDevice) {
      setActionMessage("Selecione um dispositivo para vincular.")
      return
    }

    setActionMessage(null)
    try {
      const response = await fetch(`/api/traccar/computed-attributes/${attributeId}/link`, {
        method: mode === "link" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: Number(selectedDevice) }),
      })
      const result = await response.json()
      if (result.success) {
        setActionMessage(mode === "link" ? "Atributo vinculado ao dispositivo." : "Atributo desvinculado.")
      } else {
        setActionMessage(result.error || "A operação não pôde ser concluída.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao comunicar com o Traccar."
      setActionMessage(message)
    }
  }

  const sortedAttributes = useMemo(() => {
    return [...attributes].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
  }, [attributes])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050816] via-[#050816] to-[#030412] text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 space-y-8">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400/80">TRACCAR</p>
          <h1 className="text-3xl font-semibold text-slate-50">Atributos Computados</h1>
          <p className="text-sm text-slate-400">
            Gerencie expressões JEXL aplicadas pelo Traccar para enriquecer posições (ignição, fuel, eventos, etc.).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none bg-white/5 rounded-2xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Novo atributo</CardTitle>
              <CardDescription className="text-slate-300">
                Os campos seguem o formato descrito na documentação oficial de computed attributes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ignition Power"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attribute">Chave do atributo</Label>
                  <Input
                    id="attribute"
                    value={form.attribute}
                    onChange={(e) => setForm((prev) => ({ ...prev, attribute: e.target.value }))}
                    placeholder="ignition"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-100"
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    {ATTRIBUTE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expression">Expressão (JEXL)</Label>
                  <textarea
                    id="expression"
                    className="w-full min-h-[160px] rounded-xl border border-white/10 bg-[#0f172a] p-3 font-mono text-sm text-slate-100"
                    value={form.expression}
                    onChange={(e) => setForm((prev) => ({ ...prev, expression: e.target.value }))}
                    placeholder="power ? power > 13.2 : null"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Criar atributo
                    </>
                  )}
                </Button>
                {actionMessage && (
                  <p className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                    {actionMessage}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="border-none bg-white/5 rounded-2xl backdrop-blur">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-white text-lg">Atributos cadastrados</CardTitle>
                <CardDescription className="text-slate-300">
                  Dados retornados de `/api/attributes/computed`. Use prioridade para controlar a ordem de execução.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                className="text-slate-100 border border-white/10"
                onClick={fetchAttributes}
                disabled={loadingAttributes}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {loadingAttributes && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando atributos...
                </div>
              )}
              {error && !loadingAttributes && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {!loadingAttributes && attributes.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum atributo cadastrado ainda.</p>
              )}

              {sortedAttributes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-[#101931] p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        #{item.id} · {item.description}
                      </p>
                      <p className="text-xs text-slate-400">Chave: {item.attribute}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/30">
                        {item.type}
                      </Badge>
                      <Badge className="bg-white/10 text-slate-200 border border-white/20">
                        prioridade {item.priority ?? 0}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-slate-100"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Removendo
                          </>
                        ) : (
                          <>
                            <Box className="h-4 w-4 mr-1" />
                            Remover
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Expressão</p>
                    <pre className="rounded-xl border border-white/10 bg-black/30 p-3 text-slate-100 overflow-x-auto">
                      {item.expression}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Vincular a um dispositivo</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        className="flex-1 rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-100"
                        value={selectedDeviceForAttr[item.id] || ""}
                        onChange={(e) =>
                          setSelectedDeviceForAttr((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        disabled={loadingDevices || devices.length === 0}
                      >
                        <option value="">Selecione um dispositivo</option>
                        {devices.map((device) => (
                          <option key={device.id} value={device.id}>
                            #{device.id} · {device.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-200"
                          onClick={() => handleLink(item.id, "link")}
                        >
                          Vincular
                        </Button>
                        <Button
                          variant="outline"
                          className="border-rose-500/40 text-rose-200"
                          onClick={() => handleLink(item.id, "unlink")}
                        >
                          <Unlink2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      A vinculação usa `/api/permissions` (atribui o atributo ao device no Traccar). Não é possível
                      listar automaticamente os vínculos existentes via API pública, então mantenha sua própria referência.
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
