import { firebaseAuth } from "./firebaseClient.js";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function apiRequest(path, { body, headers = {}, ...options } = {}) {
  const user = firebaseAuth?.currentUser;
  if (!user) throw new Error("Sign in before accessing the cloud workspace.");

  const idToken = await user.getIdToken();
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Authorization", `Bearer ${idToken}`);
  let requestBody = body;

  if (body !== undefined && !(body instanceof FormData) && typeof body !== "string") {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: requestHeaders,
    body: requestBody,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const payload = await response.json();
      if (typeof payload.error === "string") message = payload.error;
    } catch {
      // Keep the status-based message when the API response isn't JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response;
}

export async function apiJson(path, options) {
  const response = await apiRequest(path, options);
  return response.json();
}

export async function apiFileBlob(itemId) {
  const response = await apiRequest(`/api/items/${encodeURIComponent(itemId)}/file`);
  return response.blob();
}

export async function uploadItemFile(item, file = item.blob) {
  if (!(file instanceof Blob)) return;
  const formData = new FormData();
  formData.append("file", file, item.title);
  await apiRequest(`/api/items/${encodeURIComponent(item.id)}/file`, {
    method: "PUT",
    body: formData,
  });
}
