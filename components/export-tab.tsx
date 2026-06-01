"use client"

import { useState, useCallback } from "react"
import * as XLSX from "xlsx"
import { Download, FileSpreadsheet } from "lucide-react"
import type { MatrixData, PricingResult } from "@/lib/pricing-engine"
import {
  calculatePricing,
  LOR_INTERVALS,
  computeGlobalTgScale,
  computeTgLorProgression,
} from "@/lib/pricing-engine"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/ui/cards"

interface ExportTabProps {
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

interface ExportRow {
  "Grupo ACRISS": string
  "LOR inicio": number
  "LOR fim": number
  "Dia referencia": number
  [key: string]: string | number | null | undefined
}

export function ExportTab({
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
}: ExportTabProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateExportData = useCallback(() => {
    const tgMinRack = tgMinIva && tgMinIva > 0 ? tgMinIva / (1 + vat) : 0
    const globalScale = computeGlobalTgScale(matrixData, tgMinRack)

    const rowsDetail: ExportRow[] = []
    const rowsSmart: ExportRow[] = []
    const rowsAi: ExportRow[] = []
    const rowsEasy: ExportRow[] = []

    for (const group of matrixData.groups) {
      const tgProgression = computeTgLorProgression(matrixData, group, tgMinRack, globalScale)

      for (const lor of LOR_INTERVALS) {
        const tgOv = tgProgression.get(`${lor.lor_start}-${lor.lor_end}-${lor.days_reference}`)
        const result = calculatePricing({
          matrixData,
          group,
          days: lor.days_reference,
          counterDiscount,
          onlineDiscount,
          bfWeight,
          vat,
          easyCounterDiscount,
          aiCounterDiscount: null,
          aiOnlineDiscount: null,
          easyMarginMin,
          easyMarginMax,
          onlineExtraDiscount,
          tgMinIva,
          tgOverride: tgOv ?? null,
        })

        const issueText = result.issues.join(" | ")

        rowsDetail.push({
          "Grupo ACRISS": group,
          "LOR inicio": lor.lor_start,
          "LOR fim": lor.lor_end,
          "Dia referencia": lor.days_reference,
          "LD atual": result.ld,
          "LD novo": result.ld_new,
          "BF atual": result.bf,
          "BF novo": result.bf_new,
          "BF variacao %": result.bf_increase_pct,
          "BQ atual": result.bq,
          "BQ novo": result.bq_new,
          "BQ variacao %": result.bq_increase_pct,
          "BE atual": result.be,
          "BE novo": result.be_new,
          "BE variacao %": result.be_increase_pct,
          "TG atual": result.tg,
          "TG novo": result.tg_new,
          "TG variacao %": result.tg_increase_pct,
          "I atual": result.ip,
          "I novo": result.ip,
          "BC atual": result.bc,
          "BC novo": result.bc,
          "SMART+ atual s/IVA": result.smart_base,
          "SMART+ rack novo s/IVA": result.smart_rack_new,
          "SMART+ balcao s/IVA": result.smart_counter,
          "SMART+ online s/IVA": result.smart_online,
          "SMART+ balcao c/IVA": result.smart_counter_vat,
          "SMART+ online c/IVA": result.smart_online_vat,
          "SMART+ variacao rack %": result.smart_increase_pct,
          "SMART+ regra cumprida": result.ok_smart ? "Sim" : "Nao",
          "AI atual s/IVA": result.ai_base,
          "AI rack novo s/IVA": result.ai_rack_new,
          "AI balcao s/IVA": result.ai_counter,
          "AI online s/IVA": result.ai_online,
          "AI balcao c/IVA": result.ai_counter_vat,
          "AI online c/IVA": result.ai_online_vat,
          "AI variacao rack %": result.ai_increase_pct,
          "AI regra cumprida": result.ok_ai ? "Sim" : "Nao",
          "Pack Easy atual s/IVA": result.easy_base,
          "Pack Easy rack novo s/IVA": result.easy_rack_new,
          "Pack Easy balcao s/IVA": result.easy_counter,
          "Pack Easy online s/IVA": result.easy_online,
          "Pack Easy balcao c/IVA": result.easy_counter_vat,
          "Pack Easy online c/IVA": result.easy_online_vat,
          "Pack Easy variacao rack %": result.easy_increase_pct,
          "SMART++Easy > AI": result.ok_easy_constraint ? "Sim" : "Nao",
          "Easy Margem Balcao (EUR)": result.easy_margin_counter,
          "Easy Margem Online (EUR)": result.easy_margin_online,
          "Desc. AI Balcao necessario (%)": result.ai_counter_discount_solved !== null ? result.ai_counter_discount_solved * 100 : null,
          "Desc. AI Online necessario (%)": result.ai_online_discount_solved !== null ? result.ai_online_discount_solved * 100 : null,
          "Margem balcao OK": result.ok_easy_margin_counter ? "Sim" : "Nao",
          "Margem online OK": result.ok_easy_margin_online ? "Sim" : "Nao",
          "Observacoes": issueText,
        })

        rowsSmart.push({
          "Grupo ACRISS": group,
          "LOR inicio": lor.lor_start,
          "LOR fim": lor.lor_end,
          "Dia referencia": lor.days_reference,
          "LD atual": result.ld,
          "LD novo": result.ld_new,
          "BF atual": result.bf,
          "BF novo": result.bf_new,
          "BF variacao %": result.bf_increase_pct,
          "BQ atual": result.bq,
          "BQ novo": result.bq_new,
          "BQ variacao %": result.bq_increase_pct,
          "SMART+ atual s/IVA": result.smart_base,
          "SMART+ rack novo s/IVA": result.smart_rack_new,
          "SMART+ balcao s/IVA": result.smart_counter,
          "SMART+ online s/IVA": result.smart_online,
          "SMART+ balcao c/IVA": result.smart_counter_vat,
          "SMART+ online c/IVA": result.smart_online_vat,
          "Aumento necessario BF+BQ": result.bf_bq_gap,
          "Desconto implicito balcao": result.smart_implicit_discount,
          "Regra cumprida": result.ok_smart ? "Sim" : "Nao",
          "Observacoes": issueText,
        })

        rowsAi.push({
          "Grupo ACRISS": group,
          "LOR inicio": lor.lor_start,
          "LOR fim": lor.lor_end,
          "Dia referencia": lor.days_reference,
          "BC atual": result.bc,
          "BC novo": result.bc,
          "LD atual": result.ld,
          "LD novo": result.ld_new,
          "BF atual": result.bf,
          "BF novo": result.bf_new,
          "BQ atual": result.bq,
          "BQ novo": result.bq_new,
          "I atual": result.ip,
          "I novo": result.ip,
          "TG atual": result.tg,
          "TG novo": result.tg_new,
          "TG variacao %": result.tg_increase_pct,
          "AI atual s/IVA": result.ai_base,
          "AI rack novo s/IVA": result.ai_rack_new,
          "AI balcao s/IVA": result.ai_counter,
          "AI online s/IVA": result.ai_online,
          "AI balcao c/IVA": result.ai_counter_vat,
          "AI online c/IVA": result.ai_online_vat,
          "AI variacao rack %": result.ai_increase_pct,
          "Desconto implicito balcao": result.ai_implicit_discount,
          "Regra cumprida": result.ok_ai ? "Sim" : "Nao",
          "Observacoes": issueText,
        })

        rowsEasy.push({
          "Grupo ACRISS": group,
          "LOR inicio": lor.lor_start,
          "LOR fim": lor.lor_end,
          "Dia referencia": lor.days_reference,
          "TG atual": result.tg,
          "TG novo": result.tg_new,
          "TG variacao %": result.tg_increase_pct,
          "BC atual": result.bc,
          "BC novo": result.bc,
          "Pack Easy atual s/IVA": result.easy_base,
          "Pack Easy rack novo s/IVA": result.easy_rack_new,
          "Pack Easy balcao s/IVA": result.easy_counter,
          "Pack Easy online s/IVA": result.easy_online,
          "Pack Easy balcao c/IVA": result.easy_counter_vat,
          "Pack Easy online c/IVA": result.easy_online_vat,
          "Pack Easy variacao rack %": result.easy_increase_pct,
          "SMART+ rack novo": result.smart_rack_new,
          "SMART+ + Easy rack novo": result.smart_rack_new !== null && result.easy_rack_new !== null
            ? result.smart_rack_new + result.easy_rack_new
            : null,
          "AI rack novo": result.ai_rack_new,
          "Restricao SMART++Easy > AI": result.ok_easy_constraint ? "Sim" : "Nao",
          "AI > SMART+ Balcao": result.ok_ai_gt_smart_counter ? "Sim" : "Nao",
          "AI > SMART+ Online": result.ok_ai_gt_smart_online ? "Sim" : "Nao",
          "Desc. AI max balcao (Regra 2) (%)": result.ai_counter_discount_max_rule2 !== null ? result.ai_counter_discount_max_rule2 * 100 : null,
          "Desc. AI max online (Regra 2) (%)": result.ai_online_discount_max_rule2 !== null ? result.ai_online_discount_max_rule2 * 100 : null,
          "Easy Margem Balcao (EUR)": result.easy_margin_counter,
          "Easy Online": "n/a - so balcao",
          [`Margem [${easyMarginMin}-${easyMarginMax}EUR] balcao OK`]: result.ok_easy_margin_counter ? "Sim" : "Nao",
          [`Margem [${easyMarginMin}-${easyMarginMax}EUR] online OK`]: result.ok_easy_margin_online ? "Sim" : "Nao",
          "Desc. AI Balcao necessario (%)": result.ai_counter_discount_solved !== null ? result.ai_counter_discount_solved * 100 : null,
          "Desc. AI Online necessario (%)": result.ai_online_discount_solved !== null ? result.ai_online_discount_solved * 100 : null,
          "Observacoes": issueText,
        })
      }
    }

    const rowsParameters = [
      { "Parametro": "Desconto balcao", "Valor": counterDiscount },
      { "Parametro": "Desconto online", "Valor": onlineDiscount },
      { "Parametro": "Peso subida BF", "Valor": bfWeight },
      { "Parametro": "Peso subida BQ", "Valor": 1 - bfWeight },
      { "Parametro": "IVA", "Valor": vat },
      { "Parametro": "Regra SMART+", "Valor": "SMART+ = LD + BF + BQ (sem TG); balcao novo = balcao antigo (com TG)" },
      { "Parametro": "Regra All Inclusive", "Valor": "AI = BC + LD + BF + BQ + I + TG; LD/BF/BQ iguais ao SMART+ novo; TG sobe livremente" },
      { "Parametro": "Regra Pack Easy", "Valor": `Pack Easy = TG + BC; SO BALCAO; margem alvo: [${easyMarginMin}EUR ; ${easyMarginMax}EUR]` },
      { "Parametro": "Desc. balcao SMART+", "Valor": counterDiscount },
      { "Parametro": "Desc. online SMART+", "Valor": onlineDiscount },
      { "Parametro": "Desc. balcao Easy", "Valor": easyCounterDiscount },
      { "Parametro": "Desc. online Easy", "Valor": "n/a - Easy so balcao" },
      { "Parametro": "Margem Easy minima (EUR)", "Valor": easyMarginMin },
      { "Parametro": "Margem Easy maxima (EUR)", "Valor": easyMarginMax },
    ]

    return { rowsDetail, rowsSmart, rowsAi, rowsEasy, rowsParameters }
  }, [matrixData, counterDiscount, onlineDiscount, bfWeight, vat, easyCounterDiscount, easyMarginMin, easyMarginMax, onlineExtraDiscount, tgMinIva])

  const handleExport = useCallback(() => {
    setIsExporting(true)
    
    setTimeout(() => {
      const { rowsDetail, rowsSmart, rowsAi, rowsEasy, rowsParameters } = generateExportData()
      
      const workbook = XLSX.utils.book_new()
      
      const wsDetail = XLSX.utils.json_to_sheet(rowsDetail)
      const wsSmart = XLSX.utils.json_to_sheet(rowsSmart)
      const wsAi = XLSX.utils.json_to_sheet(rowsAi)
      const wsEasy = XLSX.utils.json_to_sheet(rowsEasy)
      const wsParams = XLSX.utils.json_to_sheet(rowsParameters)
      
      XLSX.utils.book_append_sheet(workbook, wsDetail, "Resumo_Final")
      XLSX.utils.book_append_sheet(workbook, wsSmart, "SMART+")
      XLSX.utils.book_append_sheet(workbook, wsAi, "All_Inclusive")
      XLSX.utils.book_append_sheet(workbook, wsEasy, "Pack_Easy")
      XLSX.utils.book_append_sheet(workbook, wsParams, "Parametros")
      
      const today = new Date().toISOString().split("T")[0]
      XLSX.writeFile(workbook, `SIXT_Pricing_Export_${today}.xlsx`)
      
      setIsExporting(false)
    }, 100)
  }, [generateExportData])

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Exportar Resultados
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Exporta os resultados de pricing para todos os grupos ACRISS e todos os intervalos LOR num ficheiro Excel com multiplas folhas.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold mb-2">Conteudo do ficheiro:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- <strong>Resumo_Final:</strong> Todas as metricas e calculos detalhados</li>
                <li>- <strong>SMART+:</strong> Detalhes do pacote SMART+ (LD + BF + BQ)</li>
                <li>- <strong>All_Inclusive:</strong> Detalhes do pacote All Inclusive (BC + LD + BF + BQ + I + TG)</li>
                <li>- <strong>Pack_Easy:</strong> Detalhes do Pack Easy (TG + BC, so balcao)</li>
                <li>- <strong>Parametros:</strong> Configuracoes utilizadas na simulacao</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold mb-2">Parametros actuais:</h4>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Grupos ACRISS:</span>{" "}
                  <span className="font-semibold">{matrixData.groups.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Intervalos LOR:</span>{" "}
                  <span className="font-semibold">{LOR_INTERVALS.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total linhas:</span>{" "}
                  <span className="font-semibold">{matrixData.groups.length * LOR_INTERVALS.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IVA:</span>{" "}
                  <span className="font-semibold">{(vat * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? "A gerar ficheiro..." : "Exportar para Excel"}
            </Button>
          </div>
        </div>
      </div>

      <SectionHeading label="Pre-visualizacao (primeiros 5 grupos)" icon="👁️" />
      
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Grupo</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">LOR</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">SMART+ rack</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">AI rack</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Easy rack</th>
                <th className="px-3 py-2 text-center font-semibold text-foreground">Regras OK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matrixData.groups.slice(0, 5).flatMap((group) => {
                const tgMinRack = tgMinIva && tgMinIva > 0 ? tgMinIva / (1 + vat) : 0
                const globalScale = computeGlobalTgScale(matrixData, tgMinRack)
                const tgProgression = computeTgLorProgression(matrixData, group, tgMinRack, globalScale)

                return LOR_INTERVALS.map((lor) => {
                  const tgOv = tgProgression.get(`${lor.lor_start}-${lor.lor_end}-${lor.days_reference}`)
                  const result = calculatePricing({
                    matrixData,
                    group,
                    days: lor.days_reference,
                    counterDiscount,
                    onlineDiscount,
                    bfWeight,
                    vat,
                    easyCounterDiscount,
                    easyMarginMin,
                    easyMarginMax,
                    onlineExtraDiscount,
                    tgMinIva,
                    tgOverride: tgOv ?? null,
                  })

                  const allOk =
                    result.ok_ai_gt_smart_counter &&
                    result.ok_ai_gt_smart_online &&
                    result.ok_smart_easy_gt_ai_counter &&
                    result.ok_easy_margin_counter

                  return (
                    <tr key={`${group}-${lor.lor_start}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{group}</td>
                      <td className="px-3 py-2">{lor.lor_start}-{lor.lor_end}</td>
                      <td className="px-3 py-2 text-right">
                        {result.smart_rack_new?.toFixed(2) ?? "—"}€
                      </td>
                      <td className="px-3 py-2 text-right">
                        {result.ai_rack_new?.toFixed(2) ?? "—"}€
                      </td>
                      <td className="px-3 py-2 text-right">
                        {result.easy_rack_new?.toFixed(2) ?? "—"}€
                      </td>
                      <td className="px-3 py-2 text-center">
                        {allOk ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Ajustado
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
