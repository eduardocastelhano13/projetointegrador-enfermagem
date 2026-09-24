import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import TaskList from '../../components/TaskList/TaskList'
import { getProjectById, getTaskCounts, mockUser } from '../../data/mockData'
import './ProjectDetails.css'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const initialProject = getProjectById(id)
  const [tasks, setTasks] = useState(initialProject?.tasks ?? [])

  if (!initialProject) {
    return (
      <div className="project-details">
        <Header userName={mockUser.name} />
        <div className="container">
          <p className="project-details__not-found">Projeto não encontrado.</p>
          <Link to="/projects" className="project-details__back">← Voltar para Projetos</Link>
        </div>
      </div>
    )
  }

  const project = { ...initialProject, tasks }
  const { total, done } = getTaskCounts(project)
  const progress = Math.round((done / total) * 100)

  function toggleTask(taskId) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)))
  }

  function askVita() {
    navigate('/chat', { state: { projectId: project.id, intent: 'ask-about-project' } })
  }

  return (
    <div className="project-details">
      <Header userName={mockUser.name} />

      <div className="container project-details__content">
        <Link to="/projects" className="project-details__back">← Projetos</Link>

        <div className="project-details__intro">
          <h1 className="project-details__title">{project.fullName}</h1>
          <p className="project-details__percent">{progress}% concluído</p>
          <p className="project-details__description">{project.description}</p>
        </div>

        <section className="project-details__progress">
          <h2 className="project-details__section-title">Progresso</h2>
          <div className="project-details__bar-track">
            <div className="project-details__bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="project-details__progress-note">{done} de {total} tarefas concluídas</p>
        </section>

        <section className="project-details__tasks">
          <h2 className="project-details__section-title">Tarefas</h2>
          <TaskList tasks={tasks} onToggle={toggleTask} />
        </section>

        <section className="project-details__recommendation">
          <p className="project-details__recommendation-title">{project.recommendation.title}</p>
          <p className="project-details__recommendation-text">{project.recommendation.text}</p>
          <div className="project-details__recommendation-actions">
            <button className="project-details__cta" onClick={() => navigate('/session')}>
              Começar tarefa
            </button>
            <button className="project-details__cta project-details__cta--ghost" onClick={askVita}>
              Perguntar ao VITA
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
