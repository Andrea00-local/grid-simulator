import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppShell } from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import Level1 from '@/pages/Level1'
import Level2 from '@/pages/Level2'
import Level3 from '@/pages/Level3'
import Level4 from '@/pages/Level4'

export default function App() {
  return (
    <>
      <ThemeProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/level1" element={<Level1 />} />
              <Route path="/level2" element={<Level2 />} />
              <Route path="/level3" element={<Level3 />} />
              <Route path="/level4" element={<Level4 />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ThemeProvider>
      <Analytics />
    </>
  )
}
