 import { apiJson } from "./apiClient.js";

const allowedKeys = new Set(["profile", "calendar", "whiteboard"]);

export async function loadAccountData(key) {
  if (!allowedKeys.has(key)) throw new Error("Unsupported account data type.");
  const result = await apiJson(`/api/account-data/${key}`);
  return result.data;
}

export async function saveAccountData(key, data) {
  if (!allowedKeys.has(key)) throw new Error("Unsupported account data type.");
  return apiJson(`/api/account-data/${key}`, {
    method: "PUT",
    body: { data },
  });
}
