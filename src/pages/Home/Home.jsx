import Dashboard from '../../components/Dashboard/Dashboard'
import './Home.css'

export default function Home({ userName, revealed }) {
  return (
    <main className="home">
      <Dashboard userName={userName} revealed={revealed} />
    </main>
  )
}
