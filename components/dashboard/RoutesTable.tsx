'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type RouteItem = {
  rank: number
  route: string
  trips: number
  km: number
}

interface RoutesTableProps {
  items: RouteItem[]
  className?: string
}

export function RoutesTable({ items, className }: RoutesTableProps) {
  return (
    <Card className={cn('bg-[#050816] border border-white/5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white">Rotas Mais Usadas</CardTitle>
        <CardDescription className="text-sm text-slate-400">Top rotas da semana</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-xl border border-white/5">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-300">#</TableHead>
                <TableHead className="text-slate-300">Rota</TableHead>
                <TableHead className="text-slate-300 text-right">Viagens</TableHead>
                <TableHead className="text-slate-300 text-right">Km</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.rank} className="hover:bg-white/5">
                  <TableCell className="text-slate-100 font-semibold">{item.rank}</TableCell>
                  <TableCell className="text-slate-100">{item.route}</TableCell>
                  <TableCell className="text-slate-200 text-right">{item.trips}</TableCell>
                  <TableCell className="text-slate-200 text-right">{item.km} km</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
