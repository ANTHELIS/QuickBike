import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import UserContext from './context/UserContext.jsx'
import CaptainContext from './context/CapatainContext.jsx'
import SocketProvider from './context/SocketContext.jsx'
import CaptainSettingsProvider from './context/CaptainSettingsContext.jsx'
import { SiteConfigProvider } from './context/SiteConfigContext.jsx'

createRoot(document.getElementById('root')).render(
  <SiteConfigProvider>
    <CaptainSettingsProvider>
      <CaptainContext>
        <UserContext>
          <SocketProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SocketProvider>
        </UserContext>
      </CaptainContext>
    </CaptainSettingsProvider>
  </SiteConfigProvider>
)
