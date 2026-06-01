"use client"

import { useMemo } from "react"
import type { PricingResult } from "@/lib/pricing-engine"
import { formatEur, formatPct } from "@/lib/utils"

interface CompareTabProps {
  result: PricingResult
  counterDiscountPct: number
  onlineDiscountPct: number
  easyCounterPct: number
}

export function CompareTab({
  result,
  counterDiscountPct,
  onlineDiscountPct,
  easyCounterPct,
}: CompareTabProps) {
  const aiCounterPct = result.ai_counter_discount_solved !== null
    ? result.ai_counter_discount_solved * 100
    : 0
  const aiOnlinePct = result.ai_online_discount_solved !== null
    ? result.ai_online_discount_solved * 100
    : 0

  const rows = useMemo(() => [
    {
      section: "Protecoes individuais",
      element: "BC - Roadside Protection",
      atual: result.bc,
      rackNovo: result.bc,
      balcao: null,
      online: null,
    },
    {
      section: "Protecoes individuais",
      element: "LD - Loss Damage Waiver",
      atual: result.ld,
      rackNovo: result.ld_new,
      balcao: null,
      online: null,
    },
    {
      section: "Protecoes individuais",
      element: "BF - Min. Excess LDW",
      atual: result.bf,
      rackNovo: result.bf_new,
      balcao: null,
      online: null,
    },
    {
      section: "Protecoes individuais",
      element: "BQ - Interior Protection",
      atual: result.bq,
      rackNovo: result.bq_new,
      balcao: null,
      online: null,
    },
    {
      section: "Protecoes individuais",
      element: "TG - Tyre & Windscreen",
      atual: result.tg,
      rackNovo: result.tg_new,
      balcao: null,
      online: null,
    },
    {
      section: "Protecoes individuais",
      element: "I - Personal Accident",
      atual: result.ip,
      rackNovo: result.ip,
      balcao: null,
      online: null,
    },
    {
      section: "SMART+",
      element: "SMART+ s/IVA",
      atual: result.smart_base,
      rackNovo: result.smart_rack_new,
      balcao: result.smart_counter,
      online: result.smart_online,
    },
    {
      section: "SMART+",
      element: "SMART+ c/IVA",
      atual: result.smart_base !== null ? result.smart_base * 1.23 : null,
      rackNovo: result.smart_rack_new !== null ? result.smart_rack_new * 1.23 : null,
      balcao: result.smart_counter_vat,
      online: result.smart_online_vat,
    },
    {
      section: "All Inclusive",
      element: "AI s/IVA",
      atual: result.ai_base,
      rackNovo: result.ai_rack_new,
      balcao: result.ai_counter,
      online: result.ai_online,
    },
    {
      section: "All Inclusive",
      element: "AI c/IVA",
      atual: result.ai_base !== null ? result.ai_base * 1.23 : null,
      rackNovo: result.ai_rack_new !== null ? result.ai_rack_new * 1.23 : null,
      balcao: result.ai_counter_vat,
      online: result.ai_online_vat,
    },
    {
      section: "Pack Easy",
      element: "Easy s/IVA",
      atual: result.easy_base,
      rackNovo: result.easy_rack_new,
      balcao: result.easy_counter,
      online: null,
    },
    {
      section: "Pack Easy",
      element: "Easy c/IVA",
      atual: result.easy_base !== null ? result.easy_base * 1.23 : null,
      rackNovo: result.easy_rack_new !== null ? result.easy_rack_new * 1.23 : null,
      balcao: result.easy_counter_vat,
      online: null,
    },
  ], [result])

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Tabela de Comparacao</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Valores atuais vs novos para todos os componentes e pacotes
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Seccao</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Elemento</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Preco Atual</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Rack Novo</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">
                Balcao {counterDiscountPct}%
              </th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">
                Online {onlineDiscountPct}%
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-muted-foreground">{row.section}</td>
                <td className="px-4 py-3 font-medium text-foreground">{row.element}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatEur(row.atual)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {formatEur(row.rackNovo)}
                </td>
                <td className="px-4 py-3 text-right text-primary font-medium">
                  {row.balcao !== null ? formatEur(row.balcao) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-success font-medium">
                  {row.online !== null ? formatEur(row.online) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border bg-slate-50">
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Desc. SMART+ Balcao:</span>{" "}
            <span className="font-semibold">{counterDiscountPct}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Desc. SMART+ Online:</span>{" "}
            <span className="font-semibold">{onlineDiscountPct}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Desc. AI Balcao (solver):</span>{" "}
            <span className="font-semibold">{aiCounterPct.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Desc. AI Online (solver):</span>{" "}
            <span className="font-semibold">{aiOnlinePct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
