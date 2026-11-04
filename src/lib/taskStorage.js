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
  if (!isFirebaseAuthEnabled) throw new Error("Firebase Authentication must be configured before tasks are available.");
  const payload = await apiJson("/api/tasks");
  return payload.tasks;
}

export async function saveTask(task) {
  if (!isFirebaseAuthEnabled) throw new Error("Firebase Authentication must be configured before tasks are available.");
  await apiJson(`/api/tasks/${encodeURIComponent(task.id)}`, {
    method: "PUT",
    body: task,
  });
}

export async function deleteTask(taskId) {
  if (!isFirebaseAuthEnabled) throw new Error("Firebase Authentication must be configured before tasks are available.");
  await apiJson(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
}
