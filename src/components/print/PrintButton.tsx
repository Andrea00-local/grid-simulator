import { useState } from 'react'
import { Printer } from 'lucide-react'
import html2canvas from 'html2canvas'

interface Props {
  className?: string
}

export function PrintButton({ className = '' }: Props) {
  const [loading, setLoading] = useState(false)

  async function handlePrint() {
    const main = document.querySelector('main')
    if (!main) { window.print(); return }

    setLoading(true)

    // Full-screen overlay so DOM manipulations by html2canvas are invisible
    const overlay = document.createElement('div')
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:white', 'z-index:99999',
      'display:flex', 'flex-direction:column', 'align-items:center',
      'justify-content:center', 'gap:12px', 'font-family:sans-serif',
    ].join(';')
    overlay.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      <span style="font-size:14px;color:#64748b;font-weight:500">Preparazione stampa…</span>
    `
    document.body.appendChild(overlay)

    try {
      // Let the overlay paint before starting capture
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      window.scrollTo(0, 0)

      const canvas = await html2canvas(main as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FAFAF9',
        windowWidth: window.innerWidth,
        windowHeight: main.scrollHeight,
        scrollY: 0,
        ignoreElements: el => el === overlay,
      })

      const imgData = canvas.toDataURL('image/png')
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Grid Simulator — Scenario</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: white; }
      img { width: 100%; display: block; }
      @media print { @page { margin: 0; size: auto; } }
    </style>
  </head>
  <body>
    <img src="${imgData}" />
    <script>window.onload = function() { window.print(); }<\/script>
  </body>
</html>`)
        win.document.close()
      }
    } finally {
      document.body.removeChild(overlay)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className={`print:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-wait ${className}`}
    >
      <Printer className="w-4 h-4" />
      {loading ? 'Cattura in corso…' : 'Stampa il mio scenario'}
    </button>
  )
}
