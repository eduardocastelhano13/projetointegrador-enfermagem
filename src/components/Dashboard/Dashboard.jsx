import { useState } from 'react'
import Header from '../Header/Header'
import FocusCard from '../FocusCard/FocusCard'
import ProjectsSection from '../ProjectsSection/ProjectsSection'
import WorkSession from '../WorkSession/WorkSession'
import { mockFocusProject, mockProjects } from '../../data/mockProjects'
import './Dashboard.css'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard({ userName, revealed }) {
  const [sessionAnchor, setSessionAnchor] = useState(null)

  return (
    <div className={`dashboard ${revealed ? 'is-revealed' : ''}`}>
      <Header userName={userName} />

      <div className="container dashboard__content">
        <div className="dashboard__greeting">
          <h1 className="dashboard__greeting-title">{getGreeting()}, {userName}.</h1>
          <p className="dashboard__greeting-sub">Vamos continuar de onde paramos?</p>
        </div>

        <div className="dashboard__grid">
          <div className="dashboard__main">
            <FocusCard
              project={mockFocusProject}
              revealed={revealed}
              onStartSession={() => setSessionAnchor(Date.now())}
            />
            <ProjectsSection projects={mockProjects} />
          </div>

          <div className="dashboard__side">
            <WorkSession key={sessionAnchor} projectName={mockFocusProject.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
