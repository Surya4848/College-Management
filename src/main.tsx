import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import PrivacyConsent from './PrivacyConsent'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <PrivacyConsent />
  </React.StrictMode>,
)
