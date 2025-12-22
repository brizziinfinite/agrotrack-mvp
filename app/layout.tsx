import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"

export const metadata: Metadata = {
  title: "AgroTrack - Telemetria Agrícola",
  description:
    "Sistema de monitoramento e telemetria para máquinas agrícolas em tempo real",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-dvh">
      <body
        suppressHydrationWarning
        className="h-dvh overflow-hidden antialiased bg-[#020617] text-slate-50"
      >
        <div className="flex h-dvh w-full overflow-hidden">
          <Sidebar />

          {/* IMPORTANTE:
             - overflow-hidden aqui para páginas fullscreen (mapa)
             - quem precisar rolar, rola dentro da própria página (não no layout) */}
          <main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(59,169,255,0.04),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.06),transparent_32%),#020617]">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
