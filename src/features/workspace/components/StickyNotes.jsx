import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faNoteSticky, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { createId } from "../../../lib/workspaceUtils.js";
import { deleteTask, loadTasks, saveTask } from "../../../lib/taskStorage.js";

function StickyNotes() {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [storageError, setStorageError] = useState("");
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadTasks()
      .then((savedTasks) => {
        if (active) setTasks(savedTasks);
      })
      .catch((error) => {
        if (active) setStorageError(`Tasks could not be loaded: ${error.message}`);
      })
      .finally(() => {
        if (active) setIsTasksLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function addTask(event) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    const task = { id: createId(), title, done: false, createdAt: Date.now() };
    try {
      await saveTask(task);
      setTasks((currentTasks) => [task, ...currentTasks]);
      setTaskTitle("");
      setStorageError("");
    } catch (error) {
      setStorageError(`Task could not be saved: ${error.message}`);
    }
  }

  async function toggleTask(taskId) {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, done: !task.done };
    try {
      await saveTask(updatedTask);
      setTasks((currentTasks) =>
        currentTasks.map((candidate) => candidate.id === taskId ? updatedTask : candidate),
      );
      setStorageError("");
    } catch (error) {
      setStorageError(`Task could not be updated: ${error.message}`);
    }
  }

  async function removeTask(taskId) {
    try {
      await deleteTask(taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setStorageError("");
    } catch (error) {
      setStorageError(`Task could not be deleted: ${error.message}`);
    }
  }

  const completedCount = tasks.filter((task) => task.done).length;

  return (
    <section className="sticky-notes-page" aria-label="Sticky task notes">
      <div className="sticky-notes-intro">
        <div className="sticky-notes-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faNoteSticky} />
        </div>
        <div>
          <h2>Your task notes</h2>
          <p>Write down a task, then check it off when it is done.</p>
        </div>
        <span className="sticky-notes-progress">
          {completedCount} of {tasks.length} done
        </span>
      </div>

      <form className="sticky-task-form" onSubmit={addTask}>
        <label className="visually-hidden" htmlFor="sticky-task-title">
          Task
        </label>
        <input
          id="sticky-task-title"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          placeholder="What do you need to do?"
          maxLength={140}
          required
        />
        <button type="submit" className="primary-action">
          <FontAwesomeIcon icon={faPlus} />
          <span>Add task</span>
        </button>
      </form>

      {storageError && <p className="sticky-task-error" role="alert">{storageError}</p>}

      {isTasksLoading ? (
        <div className="sticky-notes-empty" role="status">Loading tasks…</div>
      ) : tasks.length ? (
        <div className="sticky-task-grid" role="list" aria-label="Your tasks">
          {tasks.map((task, index) => (
            <article
              className={`sticky-task-card sticky-task-tone-${index % 8}${task.done ? " is-done" : ""}`}
              key={task.id}
              role="listitem"
            >
              <div className="sticky-task-card-topline">
                <button
                  type="button"
                  className="sticky-task-check"
                  aria-label={`${task.done ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
                  aria-pressed={task.done}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done && <FontAwesomeIcon icon={faCheck} aria-hidden="true" />}
                </button>
                <span>Task</span>
                <button
                  type="button"
                  className="sticky-task-delete"
                  aria-label={`Delete task: ${task.title}`}
                  title="Delete task"
                  onClick={() => removeTask(task.id)}
                >
                  <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                </button>
              </div>
              <p>{task.title}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="sticky-notes-empty">
          <FontAwesomeIcon icon={faNoteSticky} aria-hidden="true" />
          <strong>No tasks yet</strong>
          <span>Add a task above to create your first sticky note.</span>
        </div>
      )}
    </section>
  );
}

export default StickyNotes;
