export const folderColors = ["#7c6cf2", "#22a996", "#e5a84b", "#e87991", "#6688a1"];
export const THEME_STORAGE_KEY = "vsr-workspace-theme-v2";
export const PALETTE_STORAGE_KEY = "vsr-workspace-palette";
export const AI_MODEL_ID = "Qwen2-0.5B-Instruct-q4f16_1-MLC";

export const palettes = [
  { id: "ocean", label: "Midnight glow" },
  { id: "violet", label: "Soft violet" },
  { id: "sunset", label: "Warm sunset" },
  { id: "forest", label: "Calm forest" },
];

export function getSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function getSavedPalette() {
  try {
    const savedPalette = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return palettes.some((palette) => palette.id === savedPalette)
      ? savedPalette
      : "ocean";
  } catch {
    return "ocean";
  }
}
