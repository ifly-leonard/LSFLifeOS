import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { IonApp, IonIcon, IonPage, IonContent } from '@ionic/react'
import { home, construct, gitBranch, person } from 'ionicons/icons'

interface AppShellProps {
  title: string
  children: React.ReactNode
}

const TABS = [
  { id: 'home', path: '/home', label: 'Home', icon: home },
  { id: 'ui', path: '/ui-style-guide', label: 'UI', icon: construct },
  { id: 'integrations', path: '/integrations', label: 'Integrations', icon: gitBranch },
  { id: 'profile', path: '/profile', label: 'Profile', icon: person },
]

function getTitleFromPath(pathname: string): string {
  if (pathname.startsWith('/ui-style-guide')) return 'UI Style Guide'
  if (pathname.startsWith('/integrations')) return 'Integrations'
  if (pathname.startsWith('/profile')) return 'Profile'
  return 'Home'
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation()
  const history = useHistory()
  const pathname = location.pathname

  return (
    <IonApp>
      <IonPage>
        <header
          style={{
            padding: '0.85rem 1.1rem',
            borderBottom: '1px solid rgba(148,163,184,0.35)',
            background:
              'radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 55%)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="page-kicker">LSF APP STARTERKIT</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <h1 className="page-title">{getTitleFromPath(pathname)}</h1>
            </div>
          </div>
        </header>
        <IonContent fullscreen>
          <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            <div className="app-shell">
              <div className="app-content">{children}</div>
            </div>
          </main>
          <nav className="app-tabs">
            {TABS.map((tab) => {
              const isActive =
                pathname === tab.path || pathname.startsWith(tab.path + '/')
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => history.push(tab.path)}
                  className={`app-tab-btn ${isActive ? 'active' : ''}`}
                >
                  <IonIcon
                    icon={tab.icon}
                    style={{
                      fontSize: 20,
                    }}
                  />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </IonContent>
      </IonPage>
    </IonApp>
  )
}

