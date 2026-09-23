import ProjectCard from '../ProjectCard/ProjectCard'
import './ProjectsSection.css'

export default function ProjectsSection({ projects }) {
  return (
    <section className="projects-section">
      <h2 className="projects-section__title">Seus projetos</h2>
      <div className="projects-section__grid">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </section>
  )
}
