"use client"

import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUpload } from "@/components/file-upload"
import type { MatrixData } from "@/lib/pricing-engine"

interface SidebarProps {
  matrixData: MatrixData | null
  fileName: string | null
  sheetName: string
  setSheetName: (v: string) => void
  group: string
  setGroup: (v: string) => void
  days: number
  setDays: (v: number) => void
  vatPct: number
  setVatPct: (v: number) => void
  counterDiscountPct: number
  setCounterDiscountPct: (v: number) => void
  onlineDiscountPct: number
  setOnlineDiscountPct: (v: number) => void
  bfWeightPct: number
  setBfWeightPct: (v: number) => void
  easyCounterPct: number
  setEasyCounterPct: (v: number) => void
  easyMarginMin: number
  setEasyMarginMin: (v: number) => void
  easyMarginMax: number
  setEasyMarginMax: (v: number) => void
  tgMinIva: number
  setTgMinIva: (v: number) => void
  onlineExtraPct: number
  setOnlineExtraPct: (v: number) => void
  onDataLoaded: (data: MatrixData, fileName: string) => void
  onError: (error: string) => void
}

export function Sidebar({
  matrixData,
  fileName,
  sheetName,
  setSheetName,
  group,
  setGroup,
  days,
  setDays,
  vatPct,
  setVatPct,
  counterDiscountPct,
  setCounterDiscountPct,
  onlineDiscountPct,
  setOnlineDiscountPct,
  bfWeightPct,
  setBfWeightPct,
  easyCounterPct,
  setEasyCounterPct,
  easyMarginMin,
  setEasyMarginMin,
  easyMarginMax,
  setEasyMarginMax,
  tgMinIva,
  setTgMinIva,
  onlineExtraPct,
  setOnlineExtraPct,
  onDataLoaded,
  onError,
}: SidebarProps) {
  return (
    <aside className="w-80 shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 p-5 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-100">SIXT Pricing</div>
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Simulator v2
          </div>
        </div>
      </div>

      {/* Data Source Section */}
      <SidebarSection label="Fonte de dados" icon="folder" />
      
      {matrixData ? (
        <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
          <div className="text-xs text-slate-400 mb-1">Ficheiro carregado</div>
          <div className="text-sm font-medium text-slate-100 truncate">{fileName}</div>
          <div className="text-xs text-slate-500 mt-1">
            {matrixData.groups.length} grupos ACRISS
          </div>
        </div>
      ) : (
        <FileUpload
          sheetName={sheetName}
          onDataLoaded={onDataLoaded}
          onError={onError}
        />
      )}

      <Input
        label="Nome da folha"
        value={sheetName}
        onChange={(e) => setSheetName(e.target.value)}
        placeholder="Matrix - 11.05.2026"
        className="mb-4"
      />

      {matrixData && (
        <>
          {/* Selection Section */}
          <SidebarSection label="Selecao" icon="target" />
          
          <div className="space-y-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Grupo ACRISS</label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {matrixData.groups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Slider
              label="Dias de aluguer"
              valueDisplay={`${days} dias`}
              value={[days]}
              onValueChange={([v]) => setDays(v)}
              min={1}
              max={60}
              step={1}
            />

            <Slider
              label="IVA"
              valueDisplay={`${vatPct}%`}
              value={[vatPct]}
              onValueChange={([v]) => setVatPct(v)}
              min={0}
              max={30}
              step={1}
            />
          </div>

          {/* SMART+ Discounts */}
          <SidebarSection label="Descontos SMART+" icon="creditCard" />
          
          <div className="space-y-4 mb-4">
            <Slider
              label="Balcao SMART+"
              valueDisplay={`${counterDiscountPct}%`}
              value={[counterDiscountPct]}
              onValueChange={([v]) => setCounterDiscountPct(v)}
              min={0}
              max={50}
              step={1}
            />

            <Slider
              label="Online SMART+"
              valueDisplay={`${onlineDiscountPct}%`}
              value={[onlineDiscountPct]}
              onValueChange={([v]) => setOnlineDiscountPct(v)}
              min={0}
              max={60}
              step={1}
            />

            <Slider
              label="Distribuicao subida BF"
              valueDisplay={`BF ${bfWeightPct}% / BQ ${100 - bfWeightPct}%`}
              value={[bfWeightPct]}
              onValueChange={([v]) => setBfWeightPct(v)}
              min={0}
              max={100}
              step={5}
            />
          </div>

          {/* Pack Easy */}
          <SidebarSection label="Pack Easy" icon="wrench" />
          
          <div className="space-y-4 mb-4">
            <Slider
              label="Balcao Easy"
              valueDisplay={`${easyCounterPct}%`}
              value={[easyCounterPct]}
              onValueChange={([v]) => setEasyCounterPct(v)}
              min={0}
              max={50}
              step={1}
            />
            <p className="text-[10px] text-slate-500">Online: n/a - Pack Easy nao vendido online</p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Margem min. (EUR)"
                type="number"
                value={easyMarginMin}
                onChange={(e) => setEasyMarginMin(Number(e.target.value))}
                step={0.5}
                min={0}
                max={20}
              />
              <Input
                label="Margem max. (EUR)"
                type="number"
                value={easyMarginMax}
                onChange={(e) => setEasyMarginMax(Number(e.target.value))}
                step={0.5}
                min={0}
                max={30}
              />
            </div>
          </div>

          {/* TG Floor */}
          <SidebarSection label="Piso minimo TG" icon="wheel" />
          
          <div className="space-y-2 mb-4">
            <Input
              label="TG minimo c/IVA (EUR)"
              type="number"
              value={tgMinIva}
              onChange={(e) => setTgMinIva(Number(e.target.value))}
              step={0.5}
              min={0}
              max={25}
            />
            {tgMinIva > 0 && (
              <p className="text-[10px] text-slate-400">
                Rack minimo s/IVA: <span className="font-semibold text-slate-300">{(tgMinIva / 1.23).toFixed(2)} EUR</span>
              </p>
            )}
          </div>

          {/* Advanced */}
          <SidebarSection label="Avancado" icon="settings" />
          
          <Slider
            label="Extra online AI vs balcao"
            valueDisplay={`${onlineExtraPct}%`}
            value={[onlineExtraPct]}
            onValueChange={([v]) => setOnlineExtraPct(v)}
            min={0}
            max={30}
            step={1}
          />

          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-[10px] text-slate-500 text-center">
              {matrixData.groups.length} grupos ACRISS - folha {sheetName}
            </p>
          </div>
        </>
      )}
    </aside>
  )
}

function SidebarSection({ label, icon }: { label: string; icon: string }) {
  const icons: Record<string, string> = {
    folder: "📂",
    target: "🎯",
    creditCard: "💳",
    wrench: "🔧",
    wheel: "🛞",
    settings: "⚙️",
  }

  return (
    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 py-4 border-t border-slate-700 mt-1 flex items-center gap-2">
      <span>{icons[icon] || ""}</span>
      {label}
    </div>
  )
}
