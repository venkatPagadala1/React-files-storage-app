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
    <section className="sticky-notes-page grid gap-[22px] pb-5 max-[560px]:gap-[15px]" aria-label="Sticky task notes">
      <div className="sticky-notes-intro flex items-center gap-[13px] rounded-2xl p-[18px] max-[560px]:flex-wrap max-[560px]:p-[14px]">
        <div className="sticky-notes-icon grid h-[42px] w-[42px] flex-[0_0_42px] place-items-center rounded-[13px]" aria-hidden="true">
          <FontAwesomeIcon icon={faNoteSticky} />
        </div>
        <div>
          <h2 className="m-0 text-[0.95rem] text-[var(--workspace-ink)]">Your task notes</h2>
          <p className="mt-1 mb-0 text-[0.75rem] text-[var(--workspace-muted)]">Write down a task, then check it off when it is done.</p>
        </div>
        <span className="sticky-notes-progress ml-auto text-[0.72rem] text-[var(--workspace-muted)] whitespace-nowrap max-[560px]:w-full max-[560px]:ml-[55px]">
          {completedCount} of {tasks.length} done
        </span>
      </div>

      <form className="sticky-task-form flex gap-[9px] rounded-[13px] p-[13px] max-[560px]:p-[9px]" onSubmit={addTask}>
        <label className="visually-hidden" htmlFor="sticky-task-title">
          Task
        </label>
        <input
          className="min-w-0 min-h-10 flex-1 rounded-[9px] border border-[var(--workspace-border)] bg-[var(--workspace-bg)] px-3 text-[var(--workspace-ink)] text-[0.78rem] [font-family:inherit] outline-none"
          id="sticky-task-title"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          placeholder="What do you need to do?"
          maxLength={140}
          required
        />
        <button type="submit" className="primary-action min-h-10 flex-[0_0_auto] max-[560px]:px-[10px]">
          <FontAwesomeIcon icon={faPlus} />
          <span className="max-[560px]:hidden">Add task</span>
        </button>
      </form>

      {storageError && <p className="sticky-task-error -mt-3 mb-0 text-[0.75rem] text-[#b33648]" role="alert">{storageError}</p>}

      {isTasksLoading ? (
        <div className="sticky-notes-empty" role="status">Loading tasks…</div>
      ) : tasks.length ? (
        <div className="sticky-task-grid grid grid-cols-[repeat(auto-fill,minmax(min(100%,215px),1fr))] items-start gap-[14px]" role="list" aria-label="Your tasks">
          {tasks.map((task, index) => (
            <article
              className={`sticky-task-card sticky-task-tone-${index % 8} min-h-[145px] p-[15px_16px_18px]${task.done ? " is-done" : ""}`}
              key={task.id}
              role="listitem"
            >
              <div className="sticky-task-card-topline flex items-center gap-2 text-[#77715e] text-[0.67rem] font-bold tracking-[0.04em] uppercase">
                <button
                  type="button"
                  className={`sticky-task-check grid h-[27px] w-[27px] flex-[0_0_27px] place-items-center rounded-full border border-[rgb(88_79_57_/_25%)] bg-white/45 text-[#5d6655] cursor-pointer${task.done ? " !border-[#438b69] !bg-[#438b69] !text-white" : ""}`}
                  aria-label={`${task.done ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
                  aria-pressed={task.done}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done && <FontAwesomeIcon icon={faCheck} aria-hidden="true" />}
                </button>
                <span>Task</span>
                <button
                  type="button"
                  className="sticky-task-delete ml-auto grid h-[27px] w-[27px] flex-[0_0_27px] place-items-center rounded-lg border border-transparent bg-transparent text-[#817b6c] opacity-[0.65] cursor-pointer"
                  aria-label={`Delete task: ${task.title}`}
                  title="Delete task"
                  onClick={() => removeTask(task.id)}
                >
                  <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                </button>
              </div>
              <p className={`mt-[13px] mb-0 text-[0.88rem] font-[650] leading-[1.5] [overflow-wrap:anywhere]${task.done ? " !text-[#777b7d] line-through [text-decoration-thickness:1px]" : " text-[#343747]"}`}>{task.title}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="sticky-notes-empty grid min-h-[220px] content-center justify-items-center gap-[9px] rounded-2xl text-center !text-[var(--workspace-muted)]">
          <FontAwesomeIcon className="mb-[3px] text-[1.35rem] text-[var(--workspace-accent)]" icon={faNoteSticky} aria-hidden="true" />
          <strong className="text-[0.85rem] text-[var(--workspace-ink)]">No tasks yet</strong>
          <span className="text-[0.74rem]">Add a task above to create your first sticky note.</span>
        </div>
      )}
    </section>
  );
}

export default StickyNotes;
