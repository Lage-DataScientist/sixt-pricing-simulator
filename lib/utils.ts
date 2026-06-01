import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEur(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—"
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPct(value: number | null | undefined, showSign = true): string {
  if (value === null || value === undefined || isNaN(value)) return "—"
  const sign = showSign && value > 0 ? "+" : ""
  return `${sign}${(value * 100).toFixed(1)}%`
}
