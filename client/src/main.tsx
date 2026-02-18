import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './styles/base/index.css'
import './styles/shared/GlobalUi.css'
import App from './App.tsx'
import BackofficeShell from './pages/BackofficeShell.tsx'
import StoryReader from './pages/StoryReader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<BackofficeShell />} />
        <Route path="/stories/:id" element={<StoryReader />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
