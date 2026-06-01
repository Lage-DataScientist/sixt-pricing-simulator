"use client"

import type { PricingResult } from "@/lib/pricing-engine"
import { formatEur, formatPct } from "@/lib/utils"
import {
  KpiCard,
  RuleCheck,
  SectionHeading,
  PackageBanner,
  SolverBanner,
} from "@/components/ui/cards"
import { PricingChart } from "@/components/pricing-chart"

interface SimulatorTabProps {
  result: PricingResult
  group: string
  days: number
  vatPct: number
  counterDiscountPct: number
  onlineDiscountPct: number
  easyCounterPct: number
  easyMarginMin: number
  easyMarginMax: number
  onlineExtraPct: number
}

export function SimulatorTab({
  result,
  group,
  days,
  counterDiscountPct,
  onlineDiscountPct,
  easyCounterPct,
  easyMarginMin,
  easyMarginMax,
  onlineExtraPct,
}: SimulatorTabProps) {
  const aiCounterPct = result.ai_counter_discount_solved !== null
    ? result.ai_counter_discount_solved * 100
    : 0
  const aiOnlinePct = result.ai_online_discount_solved !== null
    ? result.ai_online_discount_solved * 100
    : 0

  const vlPct = result.ai_counter_discount_valid_low
  const vhPct = result.ai_counter_discount_valid_high
  const feasibleInterval = vlPct !== null && vhPct !== null && vlPct <= vhPct

  const allRulesOk =
    result.ok_ai_gt_smart_counter &&
    result.ok_ai_gt_smart_online &&
    result.ok_smart_easy_gt_ai_counter &&
    result.ok_smart_tg_gt_ai_counter &&
    result.ok_easy_margin_counter

  const smartPlusEasy =
    result.smart_rack_new !== null && result.easy_rack_new !== null
      ? result.smart_rack_new + result.easy_rack_new
      : null

  return (
    <div className="space-y-6">
      {/* Issues Alert */}
      {result.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-900 text-sm">
          <strong>Componentes indisponiveis:</strong> {result.issues.join(" - ")}
        </div>
      )}

      {/* Solver Banner */}
      {result.ai_rack_new === null ? (
        <SolverBanner variant="warn">
          Grupo sem All Inclusive (prestige) - desconto AI nao aplicavel.
        </SolverBanner>
      ) : feasibleInterval ? (
        <SolverBanner variant="ok">
          <strong>Solver AI</strong> - Intervalo valido:{" "}
          <strong>[{(vlPct! * 100).toFixed(1)}% ; {(vhPct! * 100).toFixed(1)}%]</strong> -{" "}
          Balcao: <strong>{aiCounterPct.toFixed(2)}%</strong> -{" "}
          Online: <strong>{aiOnlinePct.toFixed(2)}%</strong>
        </SolverBanner>
      ) : (
        <SolverBanner variant="warn">
          Intervalo invalido para este grupo/LOR. Desconto AI aplicado por best-effort:{" "}
          {aiCounterPct.toFixed(2)}% (balcao) - {aiOnlinePct.toFixed(2)}% (online).
        </SolverBanner>
      )}

      {/* Package Banners */}
      <div className="grid grid-cols-3 gap-4">
        <PackageBanner variant="smart" title="SMART+" formula="LD + BF + BQ (sem TG)" />
        <PackageBanner variant="ai" title="All Inclusive" formula="BC + LD + BF + BQ + I + TG" />
        <PackageBanner variant="easy" title="Pack Easy" formula="TG + BC (so balcao)" />
      </div>

      {/* SMART+ Section */}
      <SectionHeading label="SMART+ - LD + BF + BQ (sem TG)" icon="💳" color="orange" />
      <div className="grid grid-cols-6 gap-4">
        <KpiCard
          label="Referencia (c/ TG)"
          value={formatEur(result.smart_base)}
          note="LD+BF+BQ+TG historico - s/IVA"
        />
        <KpiCard
          label="Rack novo (sem TG)"
          value={formatEur(result.smart_rack_new)}
          note={`Delta rack: ${formatPct(result.smart_increase_pct)}`}
          accent="orange"
        />
        <KpiCard
          label="LD (fixo)"
          value={formatEur(result.ld)}
          note="Nao e alterado"
        />
        <KpiCard
          label="BF atual > novo"
          value={`${formatEur(result.bf)} > ${formatEur(result.bf_new)}`}
          note={`Delta ${formatPct(result.bf_increase_pct)}`}
        />
        <KpiCard
          label="BQ atual > novo"
          value={`${formatEur(result.bq)} > ${formatEur(result.bq_new)}`}
          note={`Delta ${formatPct(result.bq_increase_pct)}`}
        />
        <KpiCard
          label="Aumento BF+BQ"
          value={formatEur(result.bf_bq_gap)}
          note="Compensacao pela remocao TG"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label={`Balcao ${counterDiscountPct}% - s/IVA`}
          value={formatEur(result.smart_counter)}
          note={`${formatEur(result.smart_counter_vat)} c/IVA`}
          accent="orange"
        />
        <KpiCard
          label={`Online ${onlineDiscountPct}% - s/IVA`}
          value={formatEur(result.smart_online)}
          note={`${formatEur(result.smart_online_vat)} c/IVA`}
          accent="green"
        />
        <KpiCard
          label="Desconto implicito balcao"
          value={formatPct(result.smart_implicit_discount)}
          note="Sobre rack novo"
        />
        <KpiCard
          label="Regra balcao = antigo"
          value={result.ok_smart ? "Cumprida" : "Divergencia"}
          note={`Alvo: ${formatEur(result.smart_counter_target)} - Actual: ${formatEur(result.smart_counter)}`}
          accent={result.ok_smart ? "green" : "red"}
        />
      </div>

      {/* All Inclusive Section */}
      <SectionHeading label="All Inclusive - BC + LD + BF + BQ + I + TG" icon="💎" color="blue" />
      <div className="grid grid-cols-6 gap-4">
        <KpiCard
          label="AI referencia"
          value={formatEur(result.ai_base)}
          note="BC+LD+BF+BQ+I+TG historico - s/IVA"
        />
        <KpiCard
          label="AI rack novo"
          value={formatEur(result.ai_rack_new)}
          note={`Delta ${formatPct(result.ai_increase_pct)}`}
          accent="blue"
        />
        <KpiCard
          label="TG atual > novo"
          value={`${formatEur(result.tg)} > ${formatEur(result.tg_new)}`}
          note={
            result.tg_raised_to_min
              ? `Piso minimo aplicado (${formatEur(result.tg_min_iva)} c/IVA)`
              : `Delta ${formatPct(result.tg_increase_pct)} - unica variavel ajust.`
          }
          accent={result.tg_raised_to_min ? "orange" : undefined}
        />
        <KpiCard
          label="LD / BF / BQ no AI"
          value="= SMART+"
          note="Mesmos valores do SMART+ novo"
        />
        <KpiCard
          label={`Balcao ${aiCounterPct.toFixed(1)}% - s/IVA`}
          value={formatEur(result.ai_counter)}
          note={`${formatEur(result.ai_counter_vat)} c/IVA - desc. solver`}
          accent="blue"
        />
        <KpiCard
          label={`Online ${aiOnlinePct.toFixed(1)}% - s/IVA`}
          value={formatEur(result.ai_online)}
          note={`${formatEur(result.ai_online_vat)} c/IVA`}
          accent="purple"
        />
      </div>

      {/* Pack Easy Section */}
      <SectionHeading label="Pack Easy - TG + BC (so balcao)" icon="🔧" color="green" />
      <div className="grid grid-cols-6 gap-4">
        <KpiCard
          label="Easy referencia"
          value={formatEur(result.easy_base)}
          note="TG + BC historico - s/IVA"
        />
        <KpiCard
          label="Easy rack novo"
          value={formatEur(result.easy_rack_new)}
          note={`Delta ${formatPct(result.easy_increase_pct)}`}
          accent="green"
        />
        <KpiCard
          label="TG novo"
          value={formatEur(result.tg_new)}
          note={`Mesmo TG unitario do AI - piso ${formatEur(result.tg_min_iva)} c/IVA`}
          accent={result.tg_raised_to_min ? "orange" : undefined}
        />
        <KpiCard
          label={`Balcao ${easyCounterPct}% - s/IVA`}
          value={formatEur(result.easy_counter)}
          note={`${formatEur(result.easy_counter_vat)} c/IVA - unico canal`}
          accent="green"
        />
        <KpiCard
          label="Online Easy"
          value="n/a"
          note="Pack Easy nao e vendido online"
        />
        <KpiCard
          label="SMART+(rack) + Easy(rack)"
          value={formatEur(smartPlusEasy)}
          note={`vs AI rack: ${formatEur(result.ai_rack_new)} - Delta: ${formatEur((smartPlusEasy ?? 0) - (result.ai_rack_new ?? 0))}`}
          accent="orange"
        />
      </div>

      {/* Rule Checks */}
      <SectionHeading label="Verificacao de regras" icon="✅" />
      <div className="grid grid-cols-4 gap-4">
        <RuleCheck
          ok={result.ok_ai_gt_smart_counter}
          title="AI > SMART+ balcao"
          detail={`${formatEur(result.ai_counter)} > ${formatEur(result.smart_counter)}`}
        />
        <RuleCheck
          ok={result.ok_ai_gt_smart_online}
          title="AI > SMART+ online"
          detail={`${formatEur(result.ai_online)} > ${formatEur(result.smart_online)}`}
        />
        <RuleCheck
          ok={result.ok_smart_easy_gt_ai_counter}
          title="SMART+ + Easy > AI (balcao)"
          detail={`${formatEur((result.smart_counter ?? 0) + (result.easy_counter ?? 0))} > ${formatEur(result.ai_counter)}`}
        />
        <RuleCheck
          ok={result.ok_smart_tg_gt_ai_counter}
          title="SMART+ + TG > AI (balcao)"
          detail={`${formatEur((result.smart_counter ?? 0) + (result.tg_new ?? 0))} > ${formatEur(result.ai_counter)}`}
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <RuleCheck
          ok={result.ok_easy_margin_counter}
          title={`Margem Easy [${formatEur(easyMarginMin)} ; ${formatEur(easyMarginMax)}]`}
          detail={`Actual: ${formatEur(result.easy_margin_counter)} (balcao)`}
        />
        <RuleCheck
          ok={feasibleInterval}
          title="Intervalo solver AI valido"
          detail={
            vlPct !== null
              ? `[${(vlPct * 100).toFixed(1)}% ; ${(vhPct! * 100).toFixed(1)}%] > ponto medio ${aiCounterPct.toFixed(1)}%`
              : "Sem solucao"
          }
        />
        <RuleCheck
          ok={
            result.ai_online_discount_solved !== null &&
            result.ai_counter_discount_solved !== null &&
            (result.ai_online_discount_solved - result.ai_counter_discount_solved) * 100 >= onlineExtraPct - 0.1
          }
          title="Diferenca online vs balcao AI"
          detail={
            result.ai_online_discount_solved !== null && result.ai_counter_discount_solved !== null
              ? `+${((result.ai_online_discount_solved - result.ai_counter_discount_solved) * 100).toFixed(1)}% (min. exigido: +${onlineExtraPct}%)`
              : "—"
          }
        />
        <RuleCheck
          ok={result.ok_smart}
          title="Balcao SMART+ = balcao antigo"
          detail={`Alvo: ${formatEur(result.smart_counter_target)} - Actual: ${formatEur(result.smart_counter)}`}
        />
      </div>

      {/* Status Message */}
      {allRulesOk ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-900 text-sm">
          Todas as regras cumpridas - AI balcao {formatEur(result.ai_counter)} - AI online{" "}
          {formatEur(result.ai_online)} - Margem {formatEur(result.easy_margin_counter)} [
          {formatEur(easyMarginMin)} ; {formatEur(easyMarginMax)}]
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm">
          Regras nao cumpridas:{" "}
          {[
            !result.ok_ai_gt_smart_counter && "AI > SMART+ balcao",
            !result.ok_ai_gt_smart_online && "AI > SMART+ online",
            !result.ok_smart_easy_gt_ai_counter && "SMART++Easy > AI",
            !result.ok_smart_tg_gt_ai_counter && "SMART++TG > AI",
            !result.ok_easy_margin_counter && `Margem [${formatEur(easyMarginMin)};${formatEur(easyMarginMax)}]`,
          ]
            .filter(Boolean)
            .join(", ")}
          . O solver ajustou automaticamente o que foi possivel.
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pack Easy nao existe online. Desconto AI online >= AI balcao + {onlineExtraPct}% (comissoes).
      </p>

      {/* Chart */}
      <SectionHeading label="Comparacao visual por canal" icon="📊" />
      <PricingChart
        result={result}
        group={group}
        days={days}
        counterDiscountPct={counterDiscountPct}
        onlineDiscountPct={onlineDiscountPct}
        aiCounterPct={aiCounterPct}
        aiOnlinePct={aiOnlinePct}
        easyCounterPct={easyCounterPct}
      />
    </div>
  )
}
