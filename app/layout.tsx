import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "AgroTrack - Telemetria Agrícola",
  description: "Sistema de monitoramento e telemetria para máquinas agrícolas em tempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="antialiased bg-[#020617] text-slate-50"
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,rgba(59,169,255,0.04),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.06),transparent_32%),#020617]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
