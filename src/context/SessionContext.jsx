import { createContext, useContext, useEffect, useRef, useState } from 'react'

// Shared work-session state so the Dashboard's mini session card and the
// full Sessão page always agree on what's running, even across navigation.

const SessionContext = createContext(null)

// After this many seconds of continuous work, VITA suggests a break.
// Tune down (e.g. to 15) for a quick local demo.
export const BREAK_THRESHOLD_SECONDS = 25 * 60

export function SessionProvider({ children }) {
  const [status, setStatus] = useState('idle') // idle | running | break-suggested | on-break
  const [seconds, setSeconds] = useState(0)
  const [projectId, setProjectId] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1
          if (next >= BREAK_THRESHOLD_SECONDS) {
            setStatus('break-suggested')
          }
          return next
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [status])

  function startSession(nextProjectId) {
    setProjectId(nextProjectId)
    setSeconds(0)
    setStatus('running')
  }

  function startBreak() {
    clearInterval(intervalRef.current)
    setStatus('on-break')
  }

  function endBreak() {
    setStatus('running')
  }

  function endSession() {
    clearInterval(intervalRef.current)
    setStatus('idle')
    setSeconds(0)
    setProjectId(null)
  }

  return (
    <SessionContext.Provider
      value={{ status, seconds, projectId, startSession, startBreak, endBreak, endSession }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
