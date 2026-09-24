import { Link } from 'react-router-dom'
import ProjectCard from '../ProjectCard/ProjectCard'
import './ProjectsSection.css'

export default function ProjectsSection({ projects, compact = true, title = 'Seus projetos' }) {
  return (
    <section className="projects-section">
      <div className="projects-section__header">
        <h2 className="projects-section__title">{title}</h2>
        {compact && <Link to="/projects" className="projects-section__link">Ver todos →</Link>}
      </div>
      <div className="projects-section__grid">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            compact={compact}
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    </section>
  )
}
