"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string
  note?: string
  accent?: "orange" | "blue" | "green" | "purple" | "sky" | "red"
  className?: string
}

export function KpiCard({ label, value, note, accent, className }: KpiCardProps) {
  const accentColors = {
    orange: "border-t-[#ff5f00]",
    blue: "border-t-[#3b82f6]",
    green: "border-t-[#10b981]",
    purple: "border-t-[#8b5cf6]",
    sky: "border-t-[#0ea5e9]",
    red: "border-t-[#ef4444]",
  }

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-5 border border-border shadow-sm min-h-[110px]",
        accent && `border-t-[3px] ${accentColors[accent]}`,
        className
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </div>
      <div className="text-xl font-extrabold text-foreground leading-tight mb-1.5">
        {value}
      </div>
      {note && (
        <div className="text-[11px] text-muted-foreground leading-snug">{note}</div>
      )}
    </div>
  )
}

interface RuleCheckProps {
  ok: boolean
  title: string
  detail: string
  className?: string
}

export function RuleCheck({ ok, title, detail, className }: RuleCheckProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-3.5 flex items-start gap-2.5",
        ok ? "border-l-4 border-l-success" : "border-l-4 border-l-destructive",
        className
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          ok
            ? "bg-success/20 text-success"
            : "bg-destructive/20 text-destructive"
        )}
      >
        {ok ? "✓" : "✗"}
      </div>
      <div>
        <div className="text-xs font-semibold text-foreground mb-0.5">{title}</div>
        <div className="text-[11px] text-muted-foreground">{detail}</div>
      </div>
    </div>
  )
}

interface SectionHeadingProps {
  label: string
  icon?: string
  color?: "orange" | "blue" | "green"
}

export function SectionHeading({ label, icon, color }: SectionHeadingProps) {
  const bgColors = {
    orange: "bg-orange-50",
    blue: "bg-blue-50",
    green: "bg-green-50",
  }

  return (
    <div className="flex items-center gap-3 my-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {icon && (
        <span
          className={cn(
            "w-7 h-7 rounded-lg inline-flex items-center justify-center text-sm shrink-0",
            color && bgColors[color]
          )}
        >
          {icon}
        </span>
      )}
      <span>{label}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  )
}

interface PackageBannerProps {
  variant: "smart" | "ai" | "easy"
  title: string
  formula: string
}

export function PackageBanner({ variant, title, formula }: PackageBannerProps) {
  const variants = {
    smart: {
      bg: "bg-orange-50 border-orange-200",
      dot: "bg-[#ff5f00]",
    },
    ai: {
      bg: "bg-blue-50 border-blue-200",
      dot: "bg-[#3b82f6]",
    },
    easy: {
      bg: "bg-green-50 border-green-200",
      dot: "bg-[#10b981]",
    },
  }

  const v = variants[variant]

  return (
    <div className={cn("rounded-xl p-3.5 mb-4 flex items-start gap-3.5 border", v.bg)}>
      <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", v.dot)} />
      <div className="flex-1">
        <div className="text-[13px] font-bold text-foreground mb-0.5">{title}</div>
        <div className="text-[11px] text-muted-foreground font-mono">{formula}</div>
      </div>
    </div>
  )
}

interface SolverBannerProps {
  variant: "ok" | "warn" | "error"
  children: React.ReactNode
}

export function SolverBanner({ variant, children }: SolverBannerProps) {
  const variants = {
    ok: "bg-green-50 border-green-300 text-green-900",
    warn: "bg-amber-50 border-amber-300 text-amber-900",
    error: "bg-red-50 border-red-300 text-red-900",
  }

  return (
    <div className={cn("rounded-xl p-3.5 text-[13px] leading-relaxed border", variants[variant])}>
      {children}
    </div>
  )
}

interface StatusPillProps {
  children: React.ReactNode
}

export function StatusPill({ children }: StatusPillProps) {
  return (
    <span className="bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-slate-300">
      {children}
    </span>
  )
}
