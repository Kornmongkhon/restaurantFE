import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <div style={{fontFamily:'Prompt, sans-serif'}}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </div>
)
