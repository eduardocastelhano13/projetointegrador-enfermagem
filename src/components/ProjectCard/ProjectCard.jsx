import { Link } from 'react-router-dom'
import { getTaskCounts } from '../../data/mockData'
import './ProjectCard.css'

export default function ProjectCard({ project, style, compact = false }) {
  const { total, done, pending } = getTaskCounts(project)

  return (
    <article className="project-card" style={style}>
      <div className="project-card__top">
        <h3 className="project-card__name">{project.name}</h3>
        <span className="project-card__percent">{project.progress}%</span>
      </div>

      <div className="project-card__bar-track">
        <div className="project-card__bar-fill" style={{ width: `${project.progress}%` }} />
      </div>

      <p className="project-card__status">{project.status}</p>

      {!compact && <p className="project-card__description">{project.description}</p>}

      {!compact && (
        <div className="project-card__meta">
          <span>{total} tarefas</span>
          <span>{done} concluídas</span>
          <span>{pending} pendentes</span>
        </div>
      )}

      <div className="project-card__next">
        <span className="project-card__next-label">
          {compact ? 'Próxima tarefa' : `Última atividade · ${project.lastActivity}`}
        </span>
        <span className="project-card__next-value">
          {project.tasks.find((t) => !t.done)?.label ?? 'Tudo concluído'}
        </span>
      </div>

      {!compact && (
        <Link to={`/projects/${project.id}`} className="project-card__open">
          Abrir projeto →
        </Link>
      )}
    </article>
  )
}
