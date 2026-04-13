import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const rootElement = document.getElementById('root');

// v19.1 Nuclear Recovery: Absolute Mount Safety
try {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (e) {
  console.error("VTSP: FAILED TO MOUNT REACT ROOT", e);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0b0c10; color:white; text-align:center; font-family:sans-serif; padding: 20px;">
        <h1 style="color:#f87171;">VTSP RECOVERY MODE</h1>
        <p style="color:#94a3b8; margin-bottom:20px;">ระบบขัดข้องรุนแรงระหว่างเริ่มต้น (Boot Failure)</p>
        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" 
          style="padding:16px 32px; background:#ef4444; border:none; color:white; border-radius:12px; cursor:pointer; font-weight:bold; font-size:1.1rem; box-shadow:0 4px 12px rgba(239, 68, 68, 0.3);">
          ล้างข้อมูลและเข้าสู่ระบบใหม่ (Hard Reset)
        </button>
      </div>
    `;
  }
}
