export function createId() {
  return window.crypto?.randomUUID?.() ??
    `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getFolderDescendantIds(folders, folderId) {
  const descendantIds = new Set([folderId]);
  let hasNewDescendants = true;

  while (hasNewDescendants) {
    hasNewDescendants = false;
    folders.forEach((folder) => {
      if (
        folder.parentId &&
        descendantIds.has(folder.parentId) &&
        !descendantIds.has(folder.id)
      ) {
        descendantIds.add(folder.id);
        hasNewDescendants = true;
      }
    });
  }

  return descendantIds;
}

export function getFolderPath(folderId, folders) {
  const folderPath = [];
  const visitedFolderIds = new Set();
  let folder = folders.find((candidate) => candidate.id === folderId);

  while (folder && !visitedFolderIds.has(folder.id)) {
    visitedFolderIds.add(folder.id);
    folderPath.unshift(folder.name);
    folder = folder.parentId
      ? folders.find((candidate) => candidate.id === folder.parentId)
      : null;
  }

  return folderPath.join(" / ");
}

export function getSiblingFolders(folders, parentId) {
  return folders
    .map((folder, index) => ({ folder, index }))
    .filter(({ folder }) => (folder.parentId ?? null) === parentId)
    .sort((first, second) => {
      const firstOrder = Number.isFinite(first.folder.order)
        ? first.folder.order
        : first.index;
      const secondOrder = Number.isFinite(second.folder.order)
        ? second.folder.order
        : second.index;
      return firstOrder - secondOrder || first.index - second.index;
    })
    .map(({ folder }) => folder);
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countMatches(text, query) {
  if (!query.trim()) return 0;
  return text.match(new RegExp(escapeRegExp(query.trim()), "gi"))?.length ?? 0;
}

export function highlightDocxText(root, query) {
  root.querySelectorAll("mark.file-search-hit").forEach((mark) => {
    mark.replaceWith(...mark.childNodes);
  });
  root.normalize();
  const search = query.trim();
  if (!search) return;

  const expression = new RegExp(escapeRegExp(search), "gi");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const matches = [...node.textContent.matchAll(expression)];
    for (const match of matches.reverse()) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const mark = document.createElement("mark");
      mark.className = "file-search-hit";
      mark.append(range.extractContents());
      range.insertNode(mark);
    }
  });
}

export function getCurrentTimestamp() {
  return Date.now();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getFilePreviewType(item) {
  const mimeType = item.mimeType || item.blob?.type || "";
  const extension = item.title.split(".").pop()?.toLowerCase();

  if (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)
  ) {
    return "image";
  }
  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return "docx";
  }
  if (
    ["text/plain", "text/markdown", "text/csv"].includes(mimeType) ||
    ["application/json", "application/xml"].includes(mimeType) ||
    ["txt", "md", "csv", "json", "xml", "log"].includes(extension)
  ) {
    return "text";
  }
  if (
    mimeType.startsWith("video/") ||
    ["mp4", "webm", "ogv", "mov"].includes(extension)
  ) {
    return "video";
  }
  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "m4a", "aac"].includes(extension)
  ) {
    return "audio";
  }
  return "unsupported";
}
