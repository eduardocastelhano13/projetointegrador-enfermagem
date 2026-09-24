import ProjectCard from '../../components/ProjectCard/ProjectCard'
import Header from '../../components/Header/Header'
import { mockProjects, mockUser } from '../../data/mockData'
import './Projects.css'

export default function Projects() {
  return (
    <div className="projects-page">
      <Header userName={mockUser.name} />

      <div className="container projects-page__content">
        <div className="projects-page__intro">
          <h1 className="projects-page__title">Seus projetos</h1>
          <p className="projects-page__subtitle">
            Acompanhe o progresso dos seus projetos e descubra o que precisa ser feito.
          </p>
        </div>

        <div className="projects-page__grid">
          {mockProjects.map((project, i) => (
            <ProjectCard key={project.id} project={project} style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
