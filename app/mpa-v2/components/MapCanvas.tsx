"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
})

type Props = {
  devices: any[]
}

export default function MapCanvas({ devices }: Props) {
  return (
    <div className="absolute inset-0">
      <Map devices={devices} enableGeofence={false} />
    </div>
  )
}
