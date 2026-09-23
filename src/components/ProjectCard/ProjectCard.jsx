import './ProjectCard.css'

export default function ProjectCard({ project, style }) {
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

      <div className="project-card__next">
        <span className="project-card__next-label">Próxima tarefa</span>
        <span className="project-card__next-value">{project.nextTask}</span>
      </div>
    </article>
  )
}
