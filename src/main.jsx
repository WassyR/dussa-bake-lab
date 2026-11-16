import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const snapshot = document.getElementById('dussa-initial-catalog')
const initialCatalog = snapshot ? JSON.parse(snapshot.textContent) : undefined
const app = (
  <StrictMode>
    <BrowserRouter>
      <App initialCatalog={initialCatalog} />
    </BrowserRouter>
  </StrictMode>
)

if (root.dataset.prerendered === 'true') hydrateRoot(root, app)
else createRoot(root).render(app)
