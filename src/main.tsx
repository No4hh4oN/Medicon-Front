import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login.tsx";
import Viewer from './pages/Viewer.tsx'
import LogView from './pages/LogView.tsx'
import Register from './components/register.tsx'
import UserInfo from './components/UserInfo.tsx'
import LogsViewReadOnly from './components/log/LogViewReadOnly.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/search" element={<App />} />
        <Route path="/login" element={<Login />}/>
        <Route path="/viewer/:studyKey" element={<Viewer />}/>
        <Route path="/logView" element={<LogView />} />
        <Route path="/register" element={< Register/>} />
        <Route path="/userInfo" element={< UserInfo/>} />"
        <Route path="/logsViewReadOnly" element={< LogsViewReadOnly/>} />"
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
