import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import { IonReactRouter } from '@ionic/react-router'
import { AppShell } from './components/AppShell'

import Home from './pages/Home'
import UiStyleGuide from './pages/UiStyleGuide'
import Integrations from './pages/Integrations'
import Profile from './pages/Profile'
import WhatsAppDemo from './pages/integrations/WhatsAppDemo'
import CalendarDemo from './pages/integrations/CalendarDemo'
import JsonConfigDemo from './pages/integrations/JsonConfigDemo'
import AiDemo from './pages/integrations/AiDemo'

const App: React.FC = () => {
  return (
    <IonReactRouter>
      <Switch>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>

        <Route exact path="/home">
          <AppShell title="Home">
            <Home />
          </AppShell>
        </Route>

        <Route exact path="/ui-style-guide">
          <AppShell title="UI Style Guide">
            <UiStyleGuide />
          </AppShell>
        </Route>

        <Route exact path="/integrations" exact>
          <AppShell title="Integrations">
            <Integrations />
          </AppShell>
        </Route>

        <Route exact path="/integrations/whatsapp">
          <AppShell title="WhatsApp demo">
            <WhatsAppDemo />
          </AppShell>
        </Route>

        <Route exact path="/integrations/calendar">
          <AppShell title="Calendar demo">
            <CalendarDemo />
          </AppShell>
        </Route>

        <Route exact path="/integrations/json-config">
          <AppShell title="JSON config demo">
            <JsonConfigDemo />
          </AppShell>
        </Route>

        <Route exact path="/integrations/ai">
          <AppShell title="AI demo">
            <AiDemo />
          </AppShell>
        </Route>

        <Route exact path="/profile">
          <AppShell title="Profile">
            <Profile />
          </AppShell>
        </Route>

        <Route>
          <Redirect to="/home" />
        </Route>
      </Switch>
    </IonReactRouter>
  )
}

export default App

