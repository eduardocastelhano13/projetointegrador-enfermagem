import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomeSequence from './components/WelcomeSequence/WelcomeSequence'
import Sidebar from './components/Sidebar/Sidebar'
import { SessionProvider } from './context/SessionContext'
import { GitHubProvider } from './context/GitHubContext'
import Dashboard from './components/Dashboard/Dashboard'
import Projects from './pages/Projects/Projects'
import ProjectDetails from './pages/ProjectDetails/ProjectDetails'
import Chat from './pages/Chat/Chat'
import Session from './pages/Session/Session'
import Settings from './pages/Settings/Settings'
import Repositories from './pages/Repositories/Repositories'

// Central place where the user's name will eventually come from auth/Supabase.
const USER_NAME = 'Eduardo'

function AppShell() {
  const [introDone, setIntroDone] = useState(false)
  const handleIntroFinish = useCallback(() => setIntroDone(true), [])

  return (
    <SessionProvider>
      <GitHubProvider>
        {!introDone && (
          <WelcomeSequence userName={USER_NAME} onFinish={handleIntroFinish} />
        )}

        <div className="app-shell">
          <Sidebar />
          <main className="app-shell__content">
            <Routes>
              <Route path="/" element={<Dashboard userName={USER_NAME} revealed={introDone} />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/session" element={<Session />} />
              <Route path="/repositories" element={<Repositories />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </GitHubProvider>
    </SessionProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
