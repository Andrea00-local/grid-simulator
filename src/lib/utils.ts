import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTWh(mwh: number, decimals = 1): string {
  return (mwh / 1_000_000).toFixed(decimals)
}

export function formatGW(gw: number, decimals = 1): string {
  return gw.toFixed(decimals)
}

export function formatMtCO2(mt: number, decimals = 1): string {
  return mt.toFixed(decimals)
}

export function formatPercent(ratio: number, decimals = 0): string {
  return (ratio * 100).toFixed(decimals)
}
