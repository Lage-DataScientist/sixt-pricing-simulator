"use client"

import { useState, useMemo } from "react"
import type { MatrixData, OptimizeResult } from "@/lib/pricing-engine"
import { optimizeGlobalDiscounts, LOR_INTERVALS } from "@/lib/pricing-engine"
import { formatPct } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SectionHeading, SolverBanner } from "@/components/ui/cards"

interface OptimizerTabProps {
  matrixData: MatrixData
  counterDiscount: number
  onlineDiscount: number
  bfWeight: number
  vat: number
  easyCounterDiscount: number
  easyMarginMin: number
  easyMarginMax: number
  onlineExtraDiscount: number
  tgMinIva: number
}

export function OptimizerTab({
  matrixData,
  counterDiscount,
  onlineDiscount,
  bfWeight,
  vat,
  easyCounterDiscount,
  easyMarginMin,
  easyMarginMax,
  onlineExtraDiscount,
  tgMinIva,
}: OptimizerTabProps) {
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const handleOptimize = () => {
    setIsOptimizing(true)
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const optimResult = optimizeGlobalDiscounts({
        matrixData,
        counterDiscount,
        onlineDiscount,
        bfWeight,
        vat,
        easyCounterDiscount,
        easyMarginMin,
        easyMarginMax,
        onlineExtraDiscount,
        tgMinIva,
      })
      setResult(optimResult)
      setIsOptimizing(false)
    }, 100)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Optimizador Global de Descontos AI
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Calcula o intervalo de desconto AI que satisfaz todas as regras para todos os grupos ACRISS e todos os intervalos LOR.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <h4 className="text-sm font-semibold mb-2">Parametros actuais:</h4>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Desc. SMART+ Balcao:</span>{" "}
              <span className="font-semibold">{(counterDiscount * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Desc. SMART+ Online:</span>{" "}
              <span className="font-semibold">{(onlineDiscount * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Desc. Easy Balcao:</span>{" "}
              <span className="font-semibold">{(easyCounterDiscount * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Extra online AI:</span>{" "}
              <span className="font-semibold">{(onlineExtraDiscount * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Margem Easy:</span>{" "}
              <span className="font-semibold">[{easyMarginMin}€ ; {easyMarginMax}€]</span>
            </div>
            <div>
              <span className="text-muted-foreground">TG minimo c/IVA:</span>{" "}
              <span className="font-semibold">{tgMinIva}€</span>
            </div>
            <div>
              <span className="text-muted-foreground">Peso BF:</span>{" "}
              <span className="font-semibold">{(bfWeight * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">IVA:</span>{" "}
              <span className="font-semibold">{(vat * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <Button onClick={handleOptimize} disabled={isOptimizing}>
          {isOptimizing ? "A calcular..." : "Executar Optimizacao Global"}
        </Button>
      </div>

      {result && (
        <>
          {/* Result Summary */}
          {result.feasible ? (
            <SolverBanner variant="ok">
              <strong>Solucao encontrada!</strong> Intervalo global valido:{" "}
              <strong>[{(result.valid_low * 100).toFixed(1)}% ; {(result.valid_high * 100).toFixed(1)}%]</strong>
              <br />
              Desconto AI Balcao recomendado: <strong>{(result.ai_counter_discount * 100).toFixed(2)}%</strong>
              <br />
              Desconto AI Online recomendado: <strong>{(result.ai_online_discount * 100).toFixed(2)}%</strong>
            </SolverBanner>
          ) : (
            <SolverBanner variant="error">
              <strong>Nao existe solucao global!</strong> O intervalo esta invertido: valid_low ({(result.valid_low * 100).toFixed(1)}%) {">"} valid_high ({(result.valid_high * 100).toFixed(1)}%).
              <br />
              Verifique os conflitos abaixo e ajuste os parametros.
            </SolverBanner>
          )}

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <>
              <SectionHeading label={`Conflitos (${result.conflicts.length})`} icon="⚠️" />
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Grupo</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">LOR</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">Valid Low</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">Valid High</th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.conflicts.map((c, i) => (
                      <tr key={i} className="bg-red-50/50">
                        <td className="px-4 py-3 font-medium">{c.grupo}</td>
                        <td className="px-4 py-3">{c.lor}</td>
                        <td className="px-4 py-3 text-right">{(c.valid_low * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{(c.valid_high * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Invertido
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Coverage Table */}
          <SectionHeading label="Cobertura por Grupo/LOR" icon="📋" />
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Grupo | LOR</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Valid Low</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Valid High</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(result.coverage).map(([key, cov]) => (
                    <tr key={key} className={cov.ok === false ? "bg-red-50/50" : cov.ok === true ? "" : "bg-slate-50"}>
                      <td className="px-4 py-2 font-medium text-foreground">{key}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {cov.valid_low !== null ? `${(cov.valid_low * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {cov.valid_high !== null ? `${(cov.valid_high * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {cov.ok === true ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            OK
                          </span>
                        ) : cov.ok === false ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Conflito
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
