import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
<<<<<<< HEAD
import App from './App.tsx'
import DicomViewer from './components/DicomViewer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
=======
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
>>>>>>> 9225485 (temp: local init before linking develop)
  </StrictMode>,
)
