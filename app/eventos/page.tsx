"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { TraccarEvent, TraccarNotification } from "@/lib/traccar"
import {
  Activity,
  Bell,
  Gauge,
  Loader2,
  MapPin,
  Power,
  ShieldCheck,
  Siren,
  Zap,
} from "lucide-react"

type EventMeta = {
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badgeClass: string
  iconClass: string
}

const EVENT_META: Record<string, EventMeta> = {
  deviceOnline: {
    label: "Online",
    description: "Dispositivo conectado",
    icon: Power,
    badgeClass: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30",
    iconClass: "text-emerald-400",
  },
  deviceOffline: {
    label: "Offline",
    description: "Dispositivo desconectado",
    icon: Power,
    badgeClass: "bg-rose-500/10 text-rose-200 border border-rose-500/30",
    iconClass: "text-rose-400",
  },
  deviceUnknown: {
    label: "Status desconhecido",
    description: "Ping enviado sem posição",
    icon: Power,
    badgeClass: "bg-slate-500/10 text-slate-200 border border-slate-500/30",
    iconClass: "text-slate-400",
  },
  deviceMoving: {
    label: "Em movimento",
    description: "Traccar detectou movimento",
    icon: Activity,
    badgeClass: "bg-sky-500/10 text-sky-200 border border-sky-500/30",
    iconClass: "text-sky-400",
  },
  deviceStopped: {
    label: "Parado",
    description: "Traccar detectou parada",
    icon: Activity,
    badgeClass: "bg-indigo-500/10 text-indigo-200 border border-indigo-500/30",
    iconClass: "text-indigo-400",
  },
  ignitionOn: {
    label: "Ignição ligada",
    description: "Mudança de ignição",
    icon: Zap,
    badgeClass: "bg-amber-500/10 text-amber-200 border border-amber-500/30",
    iconClass: "text-amber-300",
  },
  ignitionOff: {
    label: "Ignição desligada",
    description: "Mudança de ignição",
    icon: Zap,
    badgeClass: "bg-amber-500/10 text-amber-200 border border-amber-500/30",
    iconClass: "text-amber-300",
  },
  geofenceEnter: {
    label: "Cerca - entrada",
    description: "Entrou em uma cerca virtual",
    icon: MapPin,
    badgeClass: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30",
    iconClass: "text-emerald-400",
  },
  geofenceExit: {
    label: "Cerca - saída",
    description: "Saiu de uma cerca virtual",
    icon: MapPin,
    badgeClass: "bg-rose-500/10 text-rose-200 border border-rose-500/30",
    iconClass: "text-rose-400",
  },
  overspeed: {
    label: "Excesso de velocidade",
    description: "Ultrapassou limite configurado",
    icon: Gauge,
    badgeClass: "bg-rose-500/10 text-rose-100 border border-rose-500/30",
    iconClass: "text-rose-400",
  },
  alarm: {
    label: "Alarme do dispositivo",
    description: "Evento enviado diretamente pelo rastreador",
    icon: Siren,
    badgeClass: "bg-orange-500/10 text-orange-200 border border-orange-500/30",
    iconClass: "text-orange-300",
  },
  maintenance: {
    label: "Manutenção",
    description: "Lembrete de manutenção configurado",
    icon: ShieldCheck,
    badgeClass: "bg-lime-500/10 text-lime-200 border border-lime-500/30",
    iconClass: "text-lime-300",
  },
}

const DEFAULT_EVENT_META: EventMeta = {
  label: "Evento",
  description: "Atualização registrada pelo Traccar",
  icon: Bell,
  badgeClass: "bg-white/5 text-slate-200 border border-white/10",
  iconClass: "text-slate-300",
}

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "deviceOnline", label: "Online" },
  { value: "deviceOffline", label: "Offline" },
  { value: "deviceUnknown", label: "Status desconhecido" },
  { value: "deviceMoving", label: "Em movimento" },
  { value: "deviceStopped", label: "Parado" },
  { value: "ignitionOn", label: "Ignição ligada" },
  { value: "ignitionOff", label: "Ignição desligada" },
  { value: "overspeed", label: "Excesso de velocidade" },
  { value: "geofenceEnter", label: "Cerca - entrada" },
  { value: "geofenceExit", label: "Cerca - saída" },
  { value: "alarm", label: "Alarme" },
  { value: "maintenance", label: "Manutenção" },
]

type NotificationChannel = "web" | "mail" | "sms"

const toDateTimeLocalValue = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const safeToIso = (value: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const describeEvent = (event: TraccarEvent) => {
  const attrs = event.attributes || {}
  if (event.type === "geofenceEnter" && event.geofenceId) {
    return `Entrada na cerca #${event.geofenceId}`
  }
  if (event.type === "geofenceExit" && event.geofenceId) {
    return `Saída da cerca #${event.geofenceId}`
  }
  if (event.type === "overspeed") {
    const limit = attrs["speedLimit"] ? `${attrs["speedLimit"]} km/h` : "limite configurado"
    const speed = attrs["speed"] ? `${Math.round(Number(attrs["speed"]))} km/h` : "velocidade registrada"
    return `Velocidade ${speed} acima de ${limit}`
  }
  if (typeof attrs["alarm"] === "string") {
    return `Alarme reportado: ${attrs["alarm"]}`
  }
  if (typeof attrs["message"] === "string") {
    return attrs["message"]
  }
  if (event.type === "deviceOnline") return "Equipamento voltou a comunicar."
  if (event.type === "deviceOffline") return "Equipamento sem comunicação."
  if (event.type === "ignitionOn") return "Ignição acionada."
  if (event.type === "ignitionOff") return "Ignição desligada."
  return "Evento registrado pelo Traccar."
}

export default function EventosPage() {
  const now = useMemo(() => new Date(), [])
  const yesterday = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000), [])

  const [events, setEvents] = useState<TraccarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState("all")
  const [deviceFilter, setDeviceFilter] = useState("")
  const [fromValue, setFromValue] = useState(toDateTimeLocalValue(yesterday))
  const [toValue, setToValue] = useState(toDateTimeLocalValue(now))

  const [notifications, setNotifications] = useState<TraccarNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [notificationSaving, setNotificationSaving] = useState<number | null>(null)

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)

    try {
      const params = new URLSearchParams()
      const fromIso = safeToIso(fromValue)
      const toIso = safeToIso(toValue)

      if (fromIso) params.set("from", fromIso)
      if (toIso) params.set("to", toIso)
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (deviceFilter.trim()) params.set("deviceId", deviceFilter.trim())

      const query = params.toString()
      const response = await fetch(`/api/traccar/events${query ? `?${query}` : ""}`)
      const result = await response.json()

      if (result.success) {
        setEvents(result.data as TraccarEvent[])
      } else {
        setEventsError(result.error || "Falha ao buscar eventos")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao buscar eventos"
      setEventsError(message)
    } finally {
      setEventsLoading(false)
    }
  }, [deviceFilter, fromValue, toValue, typeFilter])

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    setNotificationsError(null)
    try {
      const response = await fetch("/api/traccar/notifications")
      const result = await response.json()
      if (result.success) {
        setNotifications(result.data as TraccarNotification[])
      } else {
        setNotificationsError(result.error || "Não foi possível carregar notificações")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao carregar notificações"
      setNotificationsError(message)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const totalByCategory = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        if (event.type === "deviceOnline") acc.online += 1
        if (event.type === "deviceOffline") acc.offline += 1
        if (event.type === "geofenceEnter" || event.type === "geofenceExit") acc.geofence += 1
        if (event.type === "overspeed" || event.type === "alarm") acc.alerts += 1
        return acc
      },
      { online: 0, offline: 0, geofence: 0, alerts: 0 }
    )
  }, [events])

  const topEventTypes = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((event) => {
      counts[event.type] = (counts[event.type] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [events])

  const handleToggleNotification = async (notification: TraccarNotification, channel: NotificationChannel) => {
    if (!notification.id) return
    setNotificationSaving(notification.id)
    try {
      const updated: TraccarNotification = {
        ...notification,
        [channel]: !notification[channel],
      }

      const response = await fetch(`/api/traccar/notifications/${notification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })

      const result = await response.json()
      if (result.success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? (result.data as TraccarNotification) : item))
        )
      } else {
        setNotificationsError(result.error || "Falha ao atualizar notificação")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar notificação"
      setNotificationsError(message)
    } finally {
      setNotificationSaving(null)
    }
  }

  const isRangeInvalid = useMemo(() => {
    if (!fromValue || !toValue) return false
    return new Date(fromValue) > new Date(toValue)
  }, [fromValue, toValue])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="min-h-screen bg-gradient-to-b from-[#050816] via-[#050816] to-[#030412] text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400/80">TRACCAR</p>
          <h1 className="text-3xl font-semibold text-slate-50">Eventos e Notificações</h1>
          <p className="text-sm text-slate-400">
            Log completo do que o Traccar gera (status, cercas, alarmes e alertas) e canais de notificação ativos.
          </p>
        </div>

        <Card className="border-none bg-white/5 backdrop-blur rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Filtros</CardTitle>
            <CardDescription className="text-slate-300">
              Busque eventos diretamente na API do Traccar por período, dispositivo ou tipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Período inicial</label>
                <Input type="datetime-local" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Período final</label>
                <Input type="datetime-local" value={toValue} onChange={(e) => setToValue(e.target.value)} />
              </div>
            </div>
            {isRangeInvalid && (
              <p className="text-xs text-rose-300">
                O horário inicial não pode ser maior que o final.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Tipo</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-100"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-slate-300">Dispositivo (ID Traccar)</label>
                <Input
                  placeholder="123, 4501..."
                  value={deviceFilter}
                  onChange={(e) => setDeviceFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={fetchEvents}
                disabled={eventsLoading || isRangeInvalid}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {eventsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Atualizando...
                  </>
                ) : (
                  "Buscar eventos"
                )}
              </Button>
              <p className="text-xs text-slate-400">
                Exibindo últimos {events.length} eventos (limite de 200 registros por consulta).
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none bg-white/5 rounded-2xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase text-slate-400">Online</p>
              <p className="text-3xl font-semibold text-emerald-300">{totalByCategory.online}</p>
              <p className="text-xs text-slate-400 mt-1">Eventos de conexão</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-white/5 rounded-2xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase text-slate-400">Offline</p>
              <p className="text-3xl font-semibold text-rose-300">{totalByCategory.offline}</p>
              <p className="text-xs text-slate-400 mt-1">Quedas de comunicação</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-white/5 rounded-2xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase text-slate-400">Cercas</p>
              <p className="text-3xl font-semibold text-sky-300">{totalByCategory.geofence}</p>
              <p className="text-xs text-slate-400 mt-1">Entradas e saídas</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-white/5 rounded-2xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase text-slate-400">Alertas</p>
              <p className="text-3xl font-semibold text-amber-300">{totalByCategory.alerts}</p>
              <p className="text-xs text-slate-400 mt-1">Alarmes e overspeed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none bg-white/5 rounded-2xl lg:col-span-2">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg text-white">Linha do tempo</CardTitle>
                <CardDescription className="text-slate-300">
                  Eventos retornados direto do `/api/events` do Traccar.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                {events.length} eventos
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventsLoading && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando eventos...
                </div>
              )}
              {eventsError && <p className="text-sm text-rose-300">{eventsError}</p>}
              {!eventsLoading && events.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum evento encontrado no período.</p>
              )}
              <div className="space-y-3">
                {events.map((event) => {
                  const meta = EVENT_META[event.type] || DEFAULT_EVENT_META
                  const Icon = meta.icon
                  return (
                    <div
                      key={`${event.id}-${event.eventTime}`}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className={cn("mt-1 h-9 w-9 rounded-full bg-black/20 flex items-center justify-center", meta.iconClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <Badge className={cn("text-xs", meta.badgeClass)}>{meta.label}</Badge>
                            <p className="text-sm text-slate-200 mt-1">{describeEvent(event)}</p>
                          </div>
                          <p className="text-xs text-slate-400">
                            {new Date(event.eventTime).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          Device #{event.deviceId ?? "—"} · Evento #{event.id}
                          {event.geofenceId ? ` · Cerca #${event.geofenceId}` : ""}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Tipos mais frequentes</CardTitle>
              <CardDescription className="text-slate-300">
                Ranking da consulta atual (limite 4).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topEventTypes.length === 0 && !eventsLoading && (
                <p className="text-sm text-slate-400">Ainda sem dados.</p>
              )}
              {topEventTypes.map(([type, count]) => {
                const meta = EVENT_META[type] || DEFAULT_EVENT_META
                const Icon = meta.icon
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11192b]/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-full bg-black/30 flex items-center justify-center", meta.iconClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-100">{meta.label}</p>
                        <p className="text-xs text-slate-400">{meta.description}</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-white">{count}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-white/5 rounded-2xl">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg text-white">Canais de notificação</CardTitle>
              <CardDescription className="text-slate-300">
                Configuração espelhada do `/api/notifications` do Traccar (web / e-mail / SMS).
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="border-white/20 text-slate-100"
              onClick={fetchNotifications}
              disabled={notificationsLoading}
            >
              {notificationsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando...
                </>
              ) : (
                "Atualizar lista"
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationsError && <p className="text-sm text-rose-300">{notificationsError}</p>}
            {notificationsLoading && (
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando notificações configuradas...
              </div>
            )}
            {!notificationsLoading && notifications.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma notificação configurada ainda.</p>
            )}
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">#{notification.id} · {notification.type}</p>
                    <p className="text-xs text-slate-400">
                      Sempre ativo: {notification.always ? "Sim" : "Não"}
                      {notification.calendarId ? ` · Calendário #${notification.calendarId}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["web", "mail", "sms"] as NotificationChannel[]).map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => handleToggleNotification(notification, channel)}
                        disabled={notificationSaving === notification.id}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                          notification[channel]
                            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                            : "bg-white/5 border-white/10 text-slate-300"
                        )}
                      >
                        {channel.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
