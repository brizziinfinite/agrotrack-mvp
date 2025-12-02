import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { CustomerProvider } from "@/contexts/customer-context";
import { PropertyProvider } from "@/contexts/property-context";
import { PermissionsProvider } from "@/contexts/permissions-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CustomerProvider>
            <PermissionsProvider>
              <PropertyProvider>
                {children}
              </PropertyProvider>
            </PermissionsProvider>
          </CustomerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
