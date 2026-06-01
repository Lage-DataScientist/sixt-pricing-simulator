"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import type { PricingResult } from "@/lib/pricing-engine"

interface PricingChartProps {
  result: PricingResult
  group: string
  days: number
  counterDiscountPct: number
  onlineDiscountPct: number
  aiCounterPct: number
  aiOnlinePct: number
  easyCounterPct: number
}

export function PricingChart({
  result,
  group,
  days,
  counterDiscountPct,
  onlineDiscountPct,
  aiCounterPct,
  aiOnlinePct,
  easyCounterPct,
}: PricingChartProps) {
  const smartPlusEasy =
    result.smart_rack_new !== null && result.easy_rack_new !== null
      ? result.smart_rack_new + result.easy_rack_new
      : null

  const data = [
    { name: "SMART+ ref.", value: result.smart_base, color: "#ff5f00" },
    { name: "SMART+ rack", value: result.smart_rack_new, color: "#ff7a2e" },
    { name: `SMART+\nbalcao ${counterDiscountPct}%`, value: result.smart_counter, color: "#fdba74" },
    { name: `SMART+\nonline ${onlineDiscountPct}%`, value: result.smart_online, color: "#fed7aa" },
    { name: "AI ref.", value: result.ai_base, color: "#1d4ed8" },
    { name: "AI rack", value: result.ai_rack_new, color: "#3b82f6" },
    { name: `AI\nbalcao ${aiCounterPct.toFixed(1)}%`, value: result.ai_counter, color: "#60a5fa" },
    { name: `AI\nonline ${aiOnlinePct.toFixed(1)}%`, value: result.ai_online, color: "#93c5fd" },
    { name: "Easy ref.", value: result.easy_base, color: "#059669" },
    { name: "Easy rack", value: result.easy_rack_new, color: "#10b981" },
    { name: `Easy\nbalcao ${easyCounterPct}%`, value: result.easy_counter, color: "#34d399" },
    { name: "S+ + Easy\nrack", value: smartPlusEasy, color: "#8b5cf6" },
  ].filter((d) => d.value !== null && !isNaN(d.value))

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        {group} - {days} dia{days !== 1 ? "s" : ""} - precos s/IVA
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Comparacao visual por canal
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#64748b" }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(v) => `${v.toFixed(0)} EUR`}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)} EUR`, "Valor"]}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#f1f5f9" }}
            itemStyle={{ color: "#94a3b8" }}
          />
          {result.smart_base && (
            <ReferenceLine
              y={result.smart_base}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              label={{
                value: "ref. SMART+",
                position: "insideTopLeft",
                fill: "#64748b",
                fontSize: 10,
              }}
            />
          )}
          {result.ai_base && (
            <ReferenceLine
              y={result.ai_base}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              label={{
                value: "ref. AI",
                position: "insideTopRight",
                fill: "#64748b",
                fontSize: 10,
              }}
            />
          )}
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
