import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // Temporarily disable StrictMode to fix WebRTC socket issues
  // <StrictMode>
  <App />
  // </StrictMode>,
)
