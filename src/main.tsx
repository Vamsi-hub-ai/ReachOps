import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global purge of any legacy names from client storage
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key);
      if (val && (val.toLowerCase().includes('sathish') || val.toLowerCase().includes('eppakayala'))) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object') {
            if (parsed.name && (parsed.name.toLowerCase().includes('sathish') || parsed.name.toLowerCase().includes('eppakayala'))) {
              parsed.name = 'Vamsi Pallela';
            }
            if (parsed.displayName && (parsed.displayName.toLowerCase().includes('sathish') || parsed.displayName.toLowerCase().includes('eppakayala'))) {
              parsed.displayName = 'Vamsi Pallela';
            }
            localStorage.setItem(key, JSON.stringify(parsed));
          } else {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  }
} catch (_) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
