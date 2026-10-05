import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import App from './App'
import { I18nProvider } from './i18n'
import { ProposalProvider } from './proposal'
import { AccessProvider } from './access'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <AccessProvider>
          <ProposalProvider>
            <App />
          </ProposalProvider>
        </AccessProvider>
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>,
)
