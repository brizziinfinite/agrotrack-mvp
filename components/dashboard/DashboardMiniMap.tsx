"use client";

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const Map = dynamic(() => import('@/components/ui/map'), { ssr: false })

const mockDevices = [
  {
    id: 1,
    name: "Caminhão 12",
    status: "online",
    position: { latitude: -22.7467, longitude: -50.3489, speed: 62, deviceTime: new Date().toISOString() },
  },
  {
    id: 2,
    name: "Pickup 07",
    status: "online",
    position: { latitude: -22.7567, longitude: -50.3389, speed: 45, deviceTime: new Date().toISOString() },
  },
  {
    id: 3,
    name: "Trator 03",
    status: "online",
    position: { latitude: -22.7367, longitude: -50.3589, speed: 0, deviceTime: new Date().toISOString() },
  },
]

export function DashboardMiniMap() {
  return (
    <Card className="bg-[#050816] border border-white/5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 transition">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base text-white">Mapa em Tempo Real</CardTitle>
          <CardDescription className="text-sm text-slate-400">Visão geral da frota</CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
          onClick={() => (window.location.href = "/historico")}
        >
          Tela cheia
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-[520px] rounded-xl overflow-hidden border border-white/10 bg-slate-950">
          <Map devices={mockDevices} enableGeofence={false} />
        </div>
      </CardContent>
    </Card>
  )
}
