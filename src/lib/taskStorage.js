import { apiJson } from "./apiClient.js";
import { isFirebaseAuthEnabled } from "./firebaseClient.js";

export const STICKY_TASKS_STORAGE_KEY = "vsr-sticky-tasks-v1";

export function readLocalTasks() {
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

export async function loadTasks() {
  if (isFirebaseAuthEnabled) {
    const payload = await apiJson("/api/tasks");
    return payload.tasks;
  }
  return readLocalTasks();
}

export async function saveTask(task) {
  if (isFirebaseAuthEnabled) {
    await apiJson(`/api/tasks/${encodeURIComponent(task.id)}`, {
      method: "PUT",
      body: task,
    });
    return;
  }

  const tasks = readLocalTasks();
  const taskIndex = tasks.findIndex((candidate) => candidate.id === task.id);
  const nextTasks = taskIndex < 0
    ? [task, ...tasks]
    : tasks.map((candidate, index) => index === taskIndex ? task : candidate);
  window.localStorage.setItem(STICKY_TASKS_STORAGE_KEY, JSON.stringify(nextTasks));
}

export async function deleteTask(taskId) {
  if (isFirebaseAuthEnabled) {
    await apiJson(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
    return;
  }

  window.localStorage.setItem(
    STICKY_TASKS_STORAGE_KEY,
    JSON.stringify(readLocalTasks().filter((task) => task.id !== taskId)),
  );
}
