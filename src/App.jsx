import { useState, useCallback } from 'react'
import WelcomeSequence from './components/WelcomeSequence/WelcomeSequence'
import Home from './pages/Home/Home'

// Central place where the user's name will eventually come from auth/Supabase.
const USER_NAME = 'Eduardo'

export default function App() {
  const [introDone, setIntroDone] = useState(false)

  const handleIntroFinish = useCallback(() => setIntroDone(true), [])

  return (
    <>
      {!introDone && (
        <WelcomeSequence userName={USER_NAME} onFinish={handleIntroFinish} />
      )}
      {/* Home is mounted underneath from the start so the transition to it can be
          a cross-fade rather than a mount/unmount jump cut. */}
      <Home userName={USER_NAME} revealed={introDone} />
    </>
  )
}
