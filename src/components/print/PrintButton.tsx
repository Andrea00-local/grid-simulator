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
    try {
      window.scrollTo(0, 0)

      const canvas = await html2canvas(main as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FAFAF9',
        width: main.scrollWidth,
        height: main.scrollHeight,
        windowWidth: window.innerWidth,
        windowHeight: main.scrollHeight,
        scrollY: 0,
      })

      const imgData = canvas.toDataURL('image/png')
      const win = window.open('', '_blank')
      if (!win) { setLoading(false); return }

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
    } finally {
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
