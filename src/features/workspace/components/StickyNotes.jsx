import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faNoteSticky, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { createId } from "../../../lib/workspaceUtils.js";

const STICKY_TASKS_STORAGE_KEY = "vsr-sticky-tasks-v1";

function readTasks() {
  try {
    const savedTasks = window.localStorage.getItem(STICKY_TASKS_STORAGE_KEY);
    if (!savedTasks) return [];
    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) return [];
    return parsedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.done === "boolean",
    );
  } catch (error) {
    console.error("Could not load sticky tasks.", error);
    return [];
  }
}

function StickyNotes() {
  const [tasks, setTasks] = useState(readTasks);
  const [taskTitle, setTaskTitle] = useState("");
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem(STICKY_TASKS_STORAGE_KEY, JSON.stringify(tasks));
      setStorageError("");
    } catch (error) {
      console.error("Could not save sticky tasks.", error);
      setStorageError("Tasks could not be saved in this browser.");
    }
  }, [tasks]);

  function addTask(event) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    setTasks((currentTasks) => [
      { id: createId(), title, done: false, createdAt: Date.now() },
      ...currentTasks,
    ]);
    setTaskTitle("");
  }

  function toggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
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

      {tasks.length ? (
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
                  onClick={() => deleteTask(task.id)}
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
