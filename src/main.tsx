import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login.tsx";
import DicomViewer from './pages/Viewer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/search" element={<App />} />
        <Route path="/login" element={<Login />}/>
        <Route path="/dicomViewer" element={<DicomViewer />}/>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
