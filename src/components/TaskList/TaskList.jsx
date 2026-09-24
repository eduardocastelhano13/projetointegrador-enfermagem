import './TaskList.css'

export default function TaskList({ tasks, onToggle }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className={`task-list__item ${task.done ? 'is-done' : ''}`}>
          <button
            className="task-list__checkbox"
            onClick={() => onToggle(task.id)}
            aria-pressed={task.done}
            aria-label={task.done ? `Marcar "${task.label}" como pendente` : `Marcar "${task.label}" como concluída`}
          >
            {task.done ? '✓' : ''}
          </button>
          <span className="task-list__label">{task.label}</span>
        </li>
      ))}
    </ul>
  )
}
