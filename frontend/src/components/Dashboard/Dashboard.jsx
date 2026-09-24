import { useNavigate } from 'react-router-dom'
import Header from '../Header/Header'
import FocusCard from '../FocusCard/FocusCard'
import ProjectsSection from '../ProjectsSection/ProjectsSection'
import WorkSession from '../WorkSession/WorkSession'
import { useSession } from '../../context/SessionContext'
import { getProjectById, mockProjects } from '../../data/mockData'
import './Dashboard.css'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

const FOCUS_PROJECT_ID = 'elo'

export default function Dashboard({ userName, revealed }) {
  const navigate = useNavigate()
  const { startSession } = useSession()
  const focusProject = getProjectById(FOCUS_PROJECT_ID)

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
              project={focusProject}
              revealed={revealed}
              onStartSession={() => startSession(focusProject.id)}
              onChat={() => navigate('/chat', { state: { projectId: focusProject.id, intent: 'continue-project' } })}
            />
            <ProjectsSection projects={mockProjects} />
          </div>

          <div className="dashboard__side">
            <WorkSession defaultProjectId={focusProject.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
