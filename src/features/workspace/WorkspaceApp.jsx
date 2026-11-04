import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { firebaseAuth, isFirebaseAuthEnabled, isLocalAuthEmulator, missingWorkspaceSettings } from "../../lib/firebaseClient.js";
import { apiFileBlob, apiJson } from "../../lib/apiClient.js";
import { loadAccountData, saveAccountData } from "../../lib/accountStorage.js";
import { rememberAccountName } from "../../lib/welcomeNameStorage.js";
import { readLocalTasks } from "../../lib/taskStorage.js";
import {
  faFileLines,
  faPlus,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  folderColors,
  getSavedPalette,
  getSavedTheme,
  PALETTE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "../../lib/workspaceConfig.js";
import {
  countMatches,
  createId,
  downloadBlob,
  getCurrentTimestamp,
  getFolderDescendantIds,
  getFolderPath,
  getSiblingFolders,
} from "../../lib/workspaceUtils.js";
import NoteEditor from "../notes/components/NoteEditor.jsx";
import AssistantPanel from "../assistant/components/AssistantPanel.jsx";
import useAssistant from "../assistant/hooks/useAssistant.js";
import WorkspaceSidebar from "./components/WorkspaceSidebar.jsx";
import WorkspaceBottomNav from "./components/WorkspaceBottomNav.jsx";
import StickyNotes from "./components/StickyNotes.jsx";
import WorkspaceHeader from "./components/WorkspaceHeader.jsx";
import WelcomePage from "./components/WelcomePage.jsx";
import CompanyHub from "./components/CompanyHub.jsx";
import PreparationCalendar from "./components/PreparationCalendar.jsx";
import UserProfile from "./components/UserProfile.jsx";
import DocumentList from "./components/DocumentList.jsx";
import FileDetails from "../files/components/FileDetails.jsx";
import Whiteboard from "../whiteboard/Whiteboard.jsx";
import useFilePreview from "../files/hooks/useFilePreview.js";
import {
  deleteFolderAndItems,
  deleteItem,
  completeLegacyImport,
  importLegacyWorkspace,
  initializeWorkspace,
  loadWorkspace,
  readLegacyBrowserData,
  saveFolder,
  saveFolders,
  saveItem,
} from "../../lib/workspaceStorage.js";

const workspaceFeatures = ["company", "employee", "sticky-notes", "training", "calendar", "profile", "whiteboard", "upload", "assistant"];
const emptyProfile = { name: "", email: "", title: "", bio: "", avatar: "" };
const EVENT_REMINDERS_ENABLED_KEY = "vsr-browser-event-reminders-enabled-v1";
const EVENT_REMINDER_DELIVERED_KEY = "vsr-browser-event-reminders-delivered-v1";
const EVENT_REMINDER_LEAD_TIME_MS = 10 * 60 * 1000;

function getBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
}

function getBrowserRemindersEnabled() {
  try {
    return window.localStorage.getItem(EVENT_REMINDERS_ENABLED_KEY) === "enabled";
  } catch {
    return false;
  }
}

function WorkspaceApp() {
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [loadedFileBlob, setLoadedFileBlob] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftPurpose, setDraftPurpose] = useState("general");
  const [draftTopics, setDraftTopics] = useState([]);
  const [draftBoardStrokes, setDraftBoardStrokes] = useState([]);
  const [isDocumentListHidden, setIsDocumentListHidden] = useState(false);
  const [draggedTopicId, setDraggedTopicId] = useState(null);
  const draggedTopicIdRef = useRef(null);
  const [topicDropTarget, setTopicDropTarget] = useState(null);
  const [draftFolderId, setDraftFolderId] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState(null);
  const [dropPosition, setDropPosition] = useState("before");
  const [isRootDropTarget, setIsRootDropTarget] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(!firebaseAuth);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");
  const [legacyImport, setLegacyImport] = useState(null);
  const [isImportingLegacy, setIsImportingLegacy] = useState(false);
  const [legacyImportError, setLegacyImportError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarIssue, setCalendarIssue] = useState("");
  const [requestedCalendarDate, setRequestedCalendarDate] = useState("");
  const [notificationClock, setNotificationClock] = useState(() => Date.now());
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(getBrowserNotificationPermission);
  const [areBrowserRemindersEnabled, setAreBrowserRemindersEnabled] = useState(getBrowserRemindersEnabled);
  const [isSignoutInfoOpen, setIsSignoutInfoOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [activeArea, setActiveArea] = useState("company");
  const [profile, setProfile] = useState(emptyProfile);
  const [theme, setTheme] = useState(getSavedTheme);
  const [palette, setPalette] = useState(getSavedPalette);
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [isExternalEditActive, setIsExternalEditActive] = useState(false);
  const [fileDraftContent, setFileDraftContent] = useState("");
  const [savedFileContent, setSavedFileContent] = useState("");
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewSearch, setPreviewSearch] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const fileInputRef = useRef(null);
  const replaceFileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectRequestRef = useRef(0);

  const notifications = useMemo(() => {
    const items = [];
    if (storageError) {
      items.push({
        id: "workspace-storage",
        kind: "issue",
        targetArea: "employee",
        title: "Workspace storage issue",
        detail: storageError,
      });
    }
    if (calendarIssue) {
      items.push({
        id: "calendar-storage",
        kind: "issue",
        targetArea: "calendar",
        title: "Calendar issue",
        detail: calendarIssue,
      });
    }
    if (statusMessage && /could not|couldn't|invalid|error|blocked|failed|already exists|choose|add a title/i.test(statusMessage)) {
      items.push({
        id: "workspace-update",
        kind: "issue",
        targetArea: /profile/i.test(statusMessage) ? "profile" : "employee",
        title: "Workspace needs attention",
        detail: statusMessage,
      });
    }

    const now = new Date(notificationClock);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingEvents = calendarEvents
      .map((event) => ({
        ...event,
        startsAt: new Date(`${event.date}T${event.startTime || "00:00"}:00`),
      }))
      .filter((event) => !Number.isNaN(event.startsAt.getTime()) && event.startsAt >= now && event.startsAt <= nextWeek)
      .sort((first, second) => first.startsAt - second.startsAt)
      .map((event) => ({
        id: `event-${event.id}`,
        kind: "event",
        date: event.date,
        title: event.title,
        detail: `${event.startsAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${event.startTime}${event.endTime ? `–${event.endTime}` : ""} · ${event.type}`,
      }));

    return [...items, ...upcomingEvents];
  }, [calendarEvents, calendarIssue, notificationClock, statusMessage, storageError]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNotificationClock(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!areBrowserRemindersEnabled || browserNotificationPermission !== "granted") return undefined;

    const userId = firebaseAuth?.currentUser?.uid;
    if (!userId) return undefined;

    let delivered = {};
    try {
      delivered = JSON.parse(window.localStorage.getItem(EVENT_REMINDER_DELIVERED_KEY) || "{}");
      if (!delivered || typeof delivered !== "object" || Array.isArray(delivered)) delivered = {};
    } catch {
      delivered = {};
    }

    const now = Date.now();
    let didUpdateDelivered = false;
    for (const event of calendarEvents) {
      const startsAt = new Date(`${event.date}T${event.startTime || "00:00"}:00`).getTime();
      if (!Number.isFinite(startsAt)) continue;
      const reminderKey = `${userId}:${event.id}:${startsAt}`;
      const reminderAt = startsAt - EVENT_REMINDER_LEAD_TIME_MS;
      if (now < reminderAt || now >= startsAt || delivered[reminderKey]) continue;

      delivered[reminderKey] = now;
      didUpdateDelivered = true;
      const reminder = new window.Notification(`Coming up: ${event.title}`, {
        body: `Starts at ${event.startTime}${event.type ? ` · ${event.type}` : ""}.`,
        tag: `workspace-event-${event.id}-${startsAt}`,
      });
      reminder.addEventListener("click", () => {
        window.focus();
        reminder.close();
      });
    }

    if (didUpdateDelivered) {
      try {
        window.localStorage.setItem(EVENT_REMINDER_DELIVERED_KEY, JSON.stringify(delivered));
      } catch {
        // The notification can still be delivered if browser storage is unavailable.
      }
    }
    return undefined;
  }, [areBrowserRemindersEnabled, browserNotificationPermission, calendarEvents, notificationClock]);

  async function toggleBrowserReminders() {
    const wasEnabled = areBrowserRemindersEnabled;
    let permission = getBrowserNotificationPermission();
    try {
      if (permission === "default" && !wasEnabled) {
        permission = await window.Notification.requestPermission();
      }
      setBrowserNotificationPermission(permission);

      if (wasEnabled) {
        window.localStorage.removeItem(EVENT_REMINDERS_ENABLED_KEY);
        setAreBrowserRemindersEnabled(false);
        return;
      }
      if (permission === "granted") {
        window.localStorage.setItem(EVENT_REMINDERS_ENABLED_KEY, "enabled");
        setAreBrowserRemindersEnabled(true);
      }
    } catch (error) {
      console.error("Could not update browser event reminder settings.", error);
      setBrowserNotificationPermission(getBrowserNotificationPermission());
    }
  }

  useEffect(() => {
    if (!firebaseAuth) {
      return undefined;
    }
    return onAuthStateChanged(firebaseAuth, (user) => {
      setIsWorkspaceOpen(Boolean(user));
      setIsLoading(Boolean(user));
      setStorageError("");
      setIsAuthReady(true);
      if (!user) {
        setFolders([]);
        setItems([]);
        setSelectedFolderId("all");
        setSelectedItemId(null);
        setLoadedFileBlob(null);
        setIsCreatingNote(false);
        setDraftTitle("");
        setDraftContent("");
        setProfile(emptyProfile);
        setCalendarEvents([]);
        setCalendarIssue("");
        setLegacyImport(null);
      }
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error("Could not save the workspace theme preference.", error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch (error) {
      console.error("Could not save the workspace color palette.", error);
    }
  }, [palette]);

  useEffect(() => {
    if (!isWorkspaceOpen) return undefined;
    let active = true;
    setStorageError("");
    initializeWorkspace()
      .then(async (workspace) => {
        if (!active) return;
        setFolders(workspace.folders);
        setItems(workspace.items);
        setDraftFolderId(workspace.folders[0]?.id ?? "");
        const [savedProfile, savedCalendar] = await Promise.all([
          loadAccountData("profile"),
          loadAccountData("calendar"),
        ]);
        if (!active) return;
        const user = firebaseAuth.currentUser;
        setProfile({
          ...emptyProfile,
          ...(savedProfile && typeof savedProfile === "object" ? savedProfile : {}),
          name: savedProfile?.name || user?.displayName || "",
          email: user?.email || "",
        });
        rememberAccountName(user?.email, savedProfile?.name || user?.displayName || "");
        setCalendarEvents(Array.isArray(savedCalendar?.events) ? savedCalendar.events : []);
        if (isFirebaseAuthEnabled) {
          const migrationStatus = await apiJson("/api/migrations/status");
          if (active && !migrationStatus.completed) {
            const [localWorkspace, localTasks] = await Promise.all([
              loadWorkspace(),
              Promise.resolve(readLocalTasks()),
            ]);
            const legacyBrowserData = readLegacyBrowserData();
            if (
              localWorkspace.folders.length || localWorkspace.items.length || localTasks.length ||
              legacyBrowserData.profile || legacyBrowserData.calendar ||
              legacyBrowserData.whiteboard?.objects?.length
            ) {
              setLegacyImport({ ...localWorkspace, tasks: localTasks, legacyBrowserData });
            } else {
              await completeLegacyImport();
            }
          }
        }
      })
      .catch((error) => {
        if (active) {
          setStorageError(
            `Could not load the workspace: ${error.message}`,
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isWorkspaceOpen]);

  useEffect(() => {
    function handleWorkspaceKeys(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isWorkspaceOpen) {
          searchInputRef.current?.focus();
        }
      }

      if (event.key === "Escape") {
        setIsSignoutInfoOpen(false);
        setIsSidebarOpen(false);
        setIsFileViewerOpen(false);
      }
    }

    window.addEventListener("keydown", handleWorkspaceKeys);
    return () => window.removeEventListener("keydown", handleWorkspaceKeys);
  }, [isWorkspaceOpen]);

  useEffect(() => {
    if (!isFileViewerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFileViewerOpen]);

  const storedActiveItem = items.find((item) => item.id === selectedItemId) ?? null;
  const activeItem = useMemo(
    () =>
      storedActiveItem?.kind === "file" && loadedFileBlob?.id === storedActiveItem.id
        ? { ...storedActiveItem, blob: loadedFileBlob.blob }
        : storedActiveItem,
    [storedActiveItem, loadedFileBlob],
  );
  const {
    filePreviewUrl,
    setFilePreviewUrl,
    fileDocumentText,
    setFileDocumentText,
    isLoadingFileDocument,
    isRenderingDocx,
    docxPreviewRef,
    previewType: activeFilePreviewType,
    createFilePreviewUrl,
    loadFileDocument,
    clearFileDocument,
  } = useFilePreview({
    activeItem,
    previewSearch,
    onError: setStatusMessage,
    isFileViewerOpen,
  });
  const fileSearchMatchCount = countMatches(fileDocumentText, previewSearch);
  const isPreparationTrackerFocused =
    activeArea === "employee" &&
    isDocumentListHidden &&
    (isCreatingNote || activeItem?.kind === "note");
  const activeFolder = folders.find((folder) => folder.id === selectedFolderId);
  const selectedFolderIds = useMemo(
    () =>
      selectedFolderId === "all"
        ? null
        : getFolderDescendantIds(folders, selectedFolderId),
    [folders, selectedFolderId],
  );
  const isNoteDraftDirty = isCreatingNote
    ? draftTitle.trim().length > 0 ||
      draftContent.trim().length > 0 ||
      draftTopics.length > 0 ||
      draftBoardStrokes.length > 0
    : activeItem?.kind === "note" &&
      (draftTitle !== activeItem.title ||
        draftContent !== activeItem.content ||
        draftFolderId !== activeItem.folderId ||
        JSON.stringify(draftTopics) !==
          JSON.stringify(
            (activeItem.topics ?? []).map((topic) => ({
              id: topic.id,
              title: topic.title,
              importantNotes: topic.importantNotes ?? "",
              issues: topic.issues ?? "",
              pinned: topic.pinned ?? false,
              status: topic.status,
            })),
          ) ||
        JSON.stringify(draftBoardStrokes) !==
          JSON.stringify(activeItem.boardStrokes ?? []));
  const isFileDraftDirty =
    isEditingFile && fileDraftContent !== savedFileContent;
  const isDraftDirty = isNoteDraftDirty || isFileDraftDirty;

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        const matchesFolder =
          query.length > 0 ||
          selectedFolderId === "all" ||
          selectedFolderIds.has(item.folderId);
        const matchesSearch =
          !query ||
          item.title.toLocaleLowerCase().includes(query) ||
          (item.kind === "note" &&
            item.content.toLocaleLowerCase().includes(query));
        return matchesFolder && matchesSearch;
      })
      .sort((first, second) => second.updatedAt - first.updatedAt);
  }, [items, searchQuery, selectedFolderId, selectedFolderIds]);

  const selectedFolder = activeItem
    ? folders.find((folder) => folder.id === activeItem.folderId)
    : folders.find((folder) => folder.id === draftFolderId);
  const activeDocumentText =
    activeItem?.kind === "note"
      ? activeItem.content
      : activeItem?.kind === "file" &&
          ["text", "docx"].includes(activeFilePreviewType)
        ? fileDocumentText
        : "";
  const {
    assistantInput,
    assistantMessages,
    isAssistantLoading,
    assistantError,
    assistantModelState,
    assistantModelProgress,
    assistantMessagesEndRef,
    assistantInputRef,
    setAssistantInput,
    handleAskAssistant,
    handleRetryAssistant,
  } = useAssistant({
    activeItem,
    selectedFolderName: selectedFolder?.name,
    documentText: activeDocumentText,
  });

  function confirmDiscardDraft() {
    return !isDraftDirty || window.confirm("Discard your unsaved changes?");
  }

  function selectFolder(folderId) {
    if (!confirmDiscardDraft()) return;
    selectRequestRef.current += 1;
    setActiveArea("employee");
    setIsBoardOpen(false);
    clearFileDocument();
    setIsFileViewerOpen(false);
    setPreviewSearch("");
    setSelectedFolderId(folderId);
    setSelectedItemId(null);
    setLoadedFileBlob(null);
    setIsDocumentListHidden(false);
    setFilePreviewUrl("");
    setIsEditingFile(false);
    setIsExternalEditActive(false);
    setFileDraftContent("");
    setSavedFileContent("");
    setIsCreatingNote(false);
    setDraftTitle("");
    setDraftContent("");
    setDraftPurpose("general");
    setDraftTopics([]);
    setDraftBoardStrokes([]);
    setIsSidebarOpen(false);
  }

  async function selectItem(item) {
    if (!confirmDiscardDraft()) return;
    const requestId = ++selectRequestRef.current;
    let itemToOpen = item;
    if (item.kind === "file" && isFirebaseAuthEnabled && !(item.blob instanceof Blob)) {
      if (item.hasFile !== false) {
        try {
          const blob = await apiFileBlob(item.id);
          if (requestId !== selectRequestRef.current) return;
          itemToOpen = { ...item, blob };
        } catch (error) {
          if (requestId !== selectRequestRef.current) return;
          if (error.status !== 404 || error.message !== "File content is missing.") {
            setStatusMessage(`Could not open "${item.title}": ${error.message}`);
            return;
          }
          itemToOpen = { ...item, hasFile: false };
        }
      }
      if (itemToOpen.hasFile === false) {
        setStatusMessage(
          `The content for "${item.title}" is missing. Replace it with the original file to view or download it.`,
        );
      }
    }
    setActiveArea("employee");
    setIsBoardOpen(false);
    clearFileDocument();
    setIsFileViewerOpen(false);
    setPreviewSearch("");
    setSelectedItemId(itemToOpen.id);
    setLoadedFileBlob(itemToOpen.kind === "file" ? { id: itemToOpen.id, blob: itemToOpen.blob } : null);
    setIsDocumentListHidden(itemToOpen.kind === "note");
    setFilePreviewUrl(createFilePreviewUrl(itemToOpen));
    setIsEditingFile(false);
    setIsExternalEditActive(false);
    setFileDraftContent("");
    setSavedFileContent("");
    setIsCreatingNote(false);
    setDraftTitle(itemToOpen.title);
    setDraftContent(itemToOpen.content ?? "");
    setDraftPurpose(itemToOpen.purpose === "training" ? "training" : "general");
    setDraftTopics(
      itemToOpen.kind === "note"
        ? (itemToOpen.topics ?? []).map((topic, index) => ({
            id: topic.id ?? `topic-${index}`,
            title: topic.title ?? "",
            importantNotes: topic.importantNotes ?? "",
            issues: topic.issues ?? "",
            pinned: topic.pinned ?? false,
            status: ["not-started", "in-progress", "done"].includes(topic.status)
              ? topic.status
              : "not-started",
          }))
        : [],
    );
    setDraftBoardStrokes(
      itemToOpen.kind === "note" && Array.isArray(itemToOpen.boardStrokes)
        ? itemToOpen.boardStrokes
        : [],
    );
    setDraftFolderId(itemToOpen.folderId);
    if (itemToOpen.kind === "file") {
      void loadFileDocument(itemToOpen);
    }
  }

  function handleDragStart(event, payload) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-vsr-workspace-item", JSON.stringify(payload));
  }

  function handleFolderDragOver(event, folderId) {
    if (!event.dataTransfer.types.includes("application/x-vsr-workspace-item")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    setDropTargetFolderId(folderId);
    setDropPosition(event.clientY < bounds.top + bounds.height / 2 ? "before" : "after");
    setIsRootDropTarget(false);
  }

  function handleRootDragOver(event) {
    if (!event.dataTransfer.types.includes("application/x-vsr-workspace-item")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetFolderId(null);
    setIsRootDropTarget(true);
  }

  async function handleDropOnFolder(event, targetFolderId) {
    event.preventDefault();
    setDropTargetFolderId(null);
    setDropPosition("before");
    setIsRootDropTarget(false);

    const serializedPayload = event.dataTransfer.getData("application/x-vsr-workspace-item");
    if (!serializedPayload) return;

    let payload;
    try {
      payload = JSON.parse(serializedPayload);
    } catch (error) {
      console.error("Could not read the dragged workspace item.", error);
      setStatusMessage("Could not move this item because its drag data is invalid.");
      return;
    }

    const targetFolder = folders.find((folder) => folder.id === targetFolderId);
    if (!targetFolder) return;
    if (!confirmDiscardDraft()) return;

    try {
      if (payload.type === "item") {
        const item = items.find((candidate) => candidate.id === payload.id);
        if (!item || item.folderId === targetFolderId) return;
        const movedItem = {
          ...item,
          folderId: targetFolderId,
          updatedAt: getCurrentTimestamp(),
        };
        await saveItem(movedItem);
        setItems((currentItems) =>
          currentItems.map((candidate) =>
            candidate.id === movedItem.id ? movedItem : candidate,
          ),
        );
        if (selectedItemId === movedItem.id) {
          setSelectedFolderId(targetFolderId);
          setDraftFolderId(targetFolderId);
        }
        setStatusMessage(`Moved "${item.title}" to "${getFolderPath(targetFolderId, folders)}".`);
        return;
      }

      if (payload.type !== "folder") return;
      const sourceFolder = folders.find((folder) => folder.id === payload.id);
      if (!sourceFolder) return;
      if (sourceFolder.id === targetFolderId) return;

      const sourceParentId = sourceFolder.parentId ?? null;
      const targetParentId = targetFolder.parentId ?? null;
      if (sourceParentId !== targetParentId) {
        setStatusMessage("Folders can be reordered among folders at the same level. Drop files or notes to move them into a folder.");
        return;
      }

      const siblings = getSiblingFolders(folders, sourceParentId);
      const sourceIndex = siblings.findIndex((folder) => folder.id === sourceFolder.id);
      const targetIndex = siblings.findIndex((folder) => folder.id === targetFolder.id);
      if (sourceIndex < 0 || targetIndex < 0) return;

      const reordered = siblings.filter((folder) => folder.id !== sourceFolder.id);
      const insertionIndex =
        targetIndex + (dropPosition === "after" ? 1 : 0) - (sourceIndex < targetIndex ? 1 : 0);
      reordered.splice(insertionIndex, 0, sourceFolder);
      if (reordered.every((folder, index) => folder.id === siblings[index].id)) return;

      const reorderedFolders = reordered.map((folder, order) => ({
        ...folder,
        order,
      }));
      await saveFolders(reorderedFolders);
      setFolders((currentFolders) =>
        currentFolders.map((folder) =>
          reorderedFolders.find((candidate) => candidate.id === folder.id) ?? folder,
        ),
      );
      setStatusMessage(`Reordered "${sourceFolder.name}" among its sibling folders.`);
    } catch (error) {
      setStatusMessage(`Could not move item: ${error.message}`);
    }
  }

  async function handleDropOnRoot(event) {
    event.preventDefault();
    setDropTargetFolderId(null);
    setIsRootDropTarget(false);

    const serializedPayload = event.dataTransfer.getData("application/x-vsr-workspace-item");
    if (!serializedPayload) return;

    let payload;
    try {
      payload = JSON.parse(serializedPayload);
    } catch (error) {
      console.error("Could not read the dragged workspace item.", error);
      setStatusMessage("Could not move this item because its drag data is invalid.");
      return;
    }

    if (payload.type !== "folder") {
      setStatusMessage("Drop files and notes onto a folder to move them.");
      return;
    }
    const sourceFolder = folders.find((folder) => folder.id === payload.id);
    if (!sourceFolder || !sourceFolder.parentId) return;
    if (!confirmDiscardDraft()) return;
    if (
      folders.some(
        (folder) =>
          folder.id !== sourceFolder.id &&
          (folder.parentId ?? null) === null &&
          folder.name.toLocaleLowerCase() === sourceFolder.name.toLocaleLowerCase(),
      )
    ) {
      setStatusMessage(`A top-level folder named "${sourceFolder.name}" already exists.`);
      return;
    }

    try {
      const topLevelFolders = getSiblingFolders(folders, null).filter(
        (folder) => folder.id !== sourceFolder.id,
      );
      topLevelFolders.push({ ...sourceFolder, parentId: null });
      const reorderedFolders = topLevelFolders.map((folder, order) => ({
        ...folder,
        order,
      }));
      await saveFolders(reorderedFolders);
      setFolders((currentFolders) =>
        currentFolders.map((folder) =>
          reorderedFolders.find((candidate) => candidate.id === folder.id) ?? folder,
        ),
      );
      setStatusMessage(`Moved "${sourceFolder.name}" to the top level.`);
    } catch (error) {
      setStatusMessage(`Could not move folder: ${error.message}`);
    }
  }

  function startNewNote({ title = "", purpose = "general" } = {}) {
    if (!confirmDiscardDraft()) return;
    setActiveArea("employee");
    clearFileDocument();
    setIsFileViewerOpen(false);
    setPreviewSearch("");
    const destinationFolderId =
      selectedFolderId === "all" ? folders[0]?.id : selectedFolderId;
    setSelectedItemId(null);
    setIsDocumentListHidden(false);
    setFilePreviewUrl("");
    setIsEditingFile(false);
    setIsExternalEditActive(false);
    setFileDraftContent("");
    setSavedFileContent("");
    setIsCreatingNote(true);
    setDraftTitle(title);
    setDraftContent("");
    setDraftPurpose(purpose);
    setDraftTopics([]);
    setDraftBoardStrokes([]);
    setDraftFolderId(destinationFolderId ?? "");
  }

  function addPreparationTopic() {
    setIsDocumentListHidden(true);
    setDraftTopics((topics) => [
      ...topics,
      {
        id: createId(),
        title: "",
        importantNotes: "",
        issues: "",
        pinned: false,
        status: "not-started",
      },
    ]);
  }

  function updatePreparationTopic(topicId, changes) {
    setDraftTopics((topics) =>
      topics.map((topic) =>
        topic.id === topicId ? { ...topic, ...changes } : topic,
      ),
    );
  }

  function removePreparationTopic(topicId) {
    setDraftTopics((topics) => topics.filter((topic) => topic.id !== topicId));
  }

  function setPreparationTopicPinned(topicId, pinned) {
    setDraftTopics((topics) => {
      const topic = topics.find((entry) => entry.id === topicId);
      if (!topic) return topics;

      const updatedTopic = { ...topic, pinned };
      const remainingTopics = topics.filter((entry) => entry.id !== topicId);
      const insertAt = pinned
        ? remainingTopics.findIndex((entry) => !entry.pinned)
        : remainingTopics.filter((entry) => entry.pinned).length;
      const nextTopics = [...remainingTopics];
      nextTopics.splice(insertAt < 0 ? nextTopics.length : insertAt, 0, updatedTopic);
      return nextTopics;
    });
  }

  function movePreparationTopic(topicId, direction) {
    setDraftTopics((topics) => {
      const index = topics.findIndex((topic) => topic.id === topicId);
      const nextIndex = index + direction;
      if (
        index < 0 ||
        nextIndex < 0 ||
        nextIndex >= topics.length ||
        topics[index].pinned !== topics[nextIndex].pinned
      ) {
        return topics;
      }

      const nextTopics = [...topics];
      [nextTopics[index], nextTopics[nextIndex]] = [
        nextTopics[nextIndex],
        nextTopics[index],
      ];
      return nextTopics;
    });
  }

  function handleTopicDragStart(event, topicId) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-vsr-preparation-topic", topicId);
    event.dataTransfer.setData("text/plain", topicId);
    draggedTopicIdRef.current = topicId;
    setDraggedTopicId(topicId);
  }

  function handleTopicDragOver(event, targetTopic) {
    const sourceTopic = draftTopics.find(
      (topic) => topic.id === draggedTopicIdRef.current,
    );
    if (!sourceTopic || sourceTopic.pinned !== targetTopic.pinned) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    setTopicDropTarget({
      id: targetTopic.id,
      position: event.clientY < bounds.top + bounds.height / 2 ? "before" : "after",
    });
  }

  function handleTopicDrop(event, targetTopic) {
    event.preventDefault();
    const sourceTopicId =
      draggedTopicIdRef.current ||
      event.dataTransfer.getData("application/x-vsr-preparation-topic") ||
      event.dataTransfer.getData("text/plain");
    const sourceTopic = draftTopics.find((topic) => topic.id === sourceTopicId);
    if (
      !sourceTopic ||
      sourceTopic.id === targetTopic.id ||
      sourceTopic.pinned !== targetTopic.pinned
    ) {
      draggedTopicIdRef.current = null;
      setDraggedTopicId(null);
      setTopicDropTarget(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const droppedAfterMidpoint =
      event.clientY >= bounds.top + bounds.height / 2;
    setDraftTopics((topics) => {
      const remainingTopics = topics.filter((topic) => topic.id !== sourceTopicId);
      const targetIndex = remainingTopics.findIndex(
        (topic) => topic.id === targetTopic.id,
      );
      if (targetIndex < 0) return topics;

      const insertAt = targetIndex + (droppedAfterMidpoint ? 1 : 0);
      remainingTopics.splice(insertAt, 0, sourceTopic);
      return remainingTopics;
    });
    draggedTopicIdRef.current = null;
    setDraggedTopicId(null);
    setTopicDropTarget(null);
  }

  async function handleSaveNote(event) {
    event.preventDefault();
    const title = draftTitle.trim();
    if (!title) {
      setStatusMessage("Add a title before saving your note.");
      return;
    }
    if (!draftFolderId) {
      setStatusMessage("Create or choose a folder before saving.");
      return;
    }

    const now = getCurrentTimestamp();
    const topics = draftTopics
      .filter((topic) => topic.title.trim())
      .map((topic) => ({
        id: topic.id,
        title: topic.title.trim(),
        importantNotes: topic.importantNotes.trim(),
        issues: topic.issues.trim(),
        pinned: topic.pinned,
        status: topic.status,
      }));
    const note = {
      id: isCreatingNote ? createId() : activeItem.id,
      kind: "note",
      purpose: draftPurpose,
      folderId: draftFolderId,
      title,
      content: draftContent,
      topics,
      boardStrokes: draftBoardStrokes,
      createdAt: isCreatingNote ? now : activeItem.createdAt,
      updatedAt: now,
    };

    try {
      await saveItem(note);
      setItems((currentItems) =>
        isCreatingNote
          ? [note, ...currentItems]
          : currentItems.map((item) => (item.id === note.id ? note : item)),
      );
      setSelectedItemId(note.id);
      setFilePreviewUrl("");
      setSelectedFolderId(note.folderId);
      setSearchQuery("");
      setDraftTopics(topics);
      setIsCreatingNote(false);
      setStatusMessage("Note saved to your account.");
    } catch (error) {
      setStatusMessage(`Could not save note: ${error.message}`);
    }
  }

  async function handleCreateFolder(event) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    if (
      newFolderParentId &&
      !folders.some((folder) => folder.id === newFolderParentId)
    ) {
      setStatusMessage("Choose an existing parent folder.");
      return;
    }

    if (
      folders.some(
        (folder) =>
          (folder.parentId ?? null) === newFolderParentId &&
          folder.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setStatusMessage("A folder with that name already exists at this level.");
      return;
    }

    const siblingFolders = getSiblingFolders(folders, newFolderParentId);
    const folder = {
      id: createId(),
      name,
      parentId: newFolderParentId,
      order: siblingFolders.length,
      color: folderColors[folders.length % folderColors.length],
    };
    try {
      await saveFolder(folder);
      setFolders((currentFolders) => [...currentFolders, folder]);
      setSelectedFolderId(folder.id);
      if (!activeItem || isCreatingNote) setDraftFolderId(folder.id);
      setNewFolderName("");
      setIsAddingFolder(false);
      setNewFolderParentId(null);
      setStatusMessage(`Created "${name}".`);
    } catch (error) {
      setStatusMessage(`Could not create folder: ${error.message}`);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!confirmDiscardDraft()) return;
    if (file.size > 25 * 1024 * 1024) {
      setStatusMessage("Files uploaded to the cloud must be 25 MB or smaller.");
      return;
    }

    const folderId =
      selectedFolderId === "all" ? folders[0]?.id : selectedFolderId;
    if (!folderId) {
      setStatusMessage("Create a folder before uploading a file.");
      return;
    }
    const targetFolder = folders.find((folder) => folder.id === folderId);
    if (!targetFolder) {
      setStatusMessage("Choose an existing folder before uploading a file.");
      return;
    }
    if (
      !window.confirm(
        `Upload "${file.name}" to "${getFolderPath(folderId, folders)}" and save it to your account?`,
      )
    ) {
      setStatusMessage(`Upload cancelled for "${file.name}".`);
      return;
    }

    const now = getCurrentTimestamp();
    const fileItem = {
      id: createId(),
      kind: "file",
      folderId,
      title: file.name,
      blob: file,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveItem(fileItem);
      setItems((currentItems) => [fileItem, ...currentItems]);
      setSelectedFolderId(folderId);
      setSelectedItemId(fileItem.id);
      setLoadedFileBlob({ id: fileItem.id, blob: file });
      setFilePreviewUrl(createFilePreviewUrl(fileItem));
      void loadFileDocument(fileItem);
      setIsEditingFile(false);
      setIsExternalEditActive(false);
      setFileDraftContent("");
      setSavedFileContent("");
      setSearchQuery("");
      setIsCreatingNote(false);
      setDraftTitle(fileItem.title);
      setDraftContent("");
      setStatusMessage(`Uploaded "${file.name}" to your account.`);
    } catch (error) {
      setStatusMessage(`Could not store file: ${error.message}`);
    }
  }

  async function handleReplaceFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || activeItem?.kind !== "file") return;
    if (!confirmDiscardDraft()) return;
    if (file.size > 25 * 1024 * 1024) {
      setStatusMessage("Files uploaded to the cloud must be 25 MB or smaller.");
      return;
    }

    const now = getCurrentTimestamp();
    const updatedFile = {
      ...activeItem,
      title: file.name,
      blob: file,
      hasFile: true,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      updatedAt: now,
    };

    try {
      await saveItem(updatedFile);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === updatedFile.id ? updatedFile : item,
        ),
      );
      setSelectedFolderId(updatedFile.folderId);
      setSelectedItemId(updatedFile.id);
      setLoadedFileBlob({ id: updatedFile.id, blob: file });
      setFilePreviewUrl(createFilePreviewUrl(updatedFile));
      setIsEditingFile(false);
      setIsExternalEditActive(false);
      setFileDraftContent("");
      setSavedFileContent("");
      setSearchQuery("");
      setPreviewSearch("");
      void loadFileDocument(updatedFile);
      setStatusMessage(`Replaced "${activeItem.title}" with "${file.name}".`);
    } catch (error) {
      setStatusMessage(`Could not replace "${activeItem.title}": ${error.message}`);
    }
  }

  function handleEditFile() {
    if (!activeItem || activeItem.kind !== "file") return;
    if (activeFilePreviewType === "text" && isLoadingFileDocument) {
      setStatusMessage("The file is still loading. Try editing it again in a moment.");
      return;
    }

    if (activeFilePreviewType === "text") {
      setFileDraftContent(fileDocumentText);
      setSavedFileContent(fileDocumentText);
      setIsEditingFile(true);
      return;
    }

    if (!(activeItem.blob instanceof Blob)) {
      setStatusMessage(`Could not download "${activeItem.title}" for editing because its file data is unavailable.`);
      return;
    }

    downloadBlob(activeItem.blob, activeItem.title);
    setIsExternalEditActive(true);
    setStatusMessage(
      `Downloaded "${activeItem.title}" for editing in a compatible app. After editing, choose Save edited copy to replace it here.`,
    );
  }

  async function handleSaveFile() {
    if (!activeItem || activeItem.kind !== "file") return;

    try {
      const blob = new Blob([fileDraftContent], {
        type: activeItem.mimeType || activeItem.blob?.type || "text/plain",
      });

      const updatedFile = {
        ...activeItem,
        blob,
        size: blob.size,
        updatedAt: Date.now(),
      };
      await saveItem(updatedFile);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === updatedFile.id ? updatedFile : item,
        ),
      );
      setLoadedFileBlob({ id: updatedFile.id, blob });
      setFilePreviewUrl(createFilePreviewUrl(updatedFile));
      setFileDocumentText(fileDraftContent);
      setSavedFileContent(fileDraftContent);
      setIsEditingFile(false);
      setStatusMessage(`Saved changes to "${updatedFile.title}" in your account.`);
    } catch (error) {
      setStatusMessage(`Could not save changes to "${activeItem.title}": ${error.message}`);
    }
  }

  function cancelFileEdit() {
    if (!confirmDiscardDraft()) return;
    setIsEditingFile(false);
    setIsExternalEditActive(false);
    setFileDraftContent("");
    setSavedFileContent("");
  }

  function handleFileEditorKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (isFileDraftDirty) void handleSaveFile();
    }
  }

  async function handleDeleteItem(itemToDelete = activeItem) {
    if (!itemToDelete) return;
    if (!window.confirm(`Permanently delete "${itemToDelete.title}" from your account?`)) {
      return;
    }

    try {
      await deleteItem(itemToDelete.id);
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemToDelete.id),
      );
      if (selectedItemId === itemToDelete.id) {
        setSelectedItemId(null);
        setLoadedFileBlob(null);
        setFilePreviewUrl("");
        clearFileDocument();
        setIsEditingFile(false);
        setFileDraftContent("");
        setSavedFileContent("");
        setDraftTitle("");
        setDraftContent("");
        setDraftTopics([]);
        setIsCreatingNote(false);
      }
      setStatusMessage(`Deleted "${itemToDelete.title}" from your account.`);
    } catch (error) {
      setStatusMessage(`Could not delete item: ${error.message}`);
    }
  }

  async function handleDeleteFolder(folder) {
    if (!confirmDiscardDraft()) return;
    const folderIds = getFolderDescendantIds(folders, folder.id);
    const folderItems = items.filter((item) => folderIds.has(item.folderId));
    const detail = folderItems.length
      ? ` The folder and its subfolders, including ${folderItems.length} item(s), will also be deleted.`
      : " The folder and its subfolders will be deleted.";
    if (!window.confirm(`Delete "${folder.name}"?${detail}`)) return;

    try {
      await deleteFolderAndItems([...folderIds]);
      setFolders((currentFolders) =>
        currentFolders.filter((item) => !folderIds.has(item.id)),
      );
      setItems((currentItems) =>
        currentItems.filter((item) => !folderIds.has(item.folderId)),
      );
      if (
        folderIds.has(selectedFolderId) ||
        folderIds.has(activeItem?.folderId)
      ) {
        setSelectedFolderId("all");
        setSelectedItemId(null);
        setFilePreviewUrl("");
        clearFileDocument();
        setIsCreatingNote(false);
        setDraftTitle("");
        setDraftContent("");
        setDraftTopics([]);
      }
      setStatusMessage(`Deleted "${folder.name}".`);
    } catch (error) {
      setStatusMessage(`Could not delete folder: ${error.message}`);
    }
  }

  function handleDownload() {
    if (!activeItem) return;
    if (activeItem.kind === "file") {
      downloadBlob(activeItem.blob, activeItem.title);
      return;
    }

    const markdown = `# ${activeItem.title}\n\n${activeItem.content}`;
    downloadBlob(
      new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
      `${activeItem.title.replace(/[<>:"/\\|?*]/g, "-")}.md`,
    );
  }

  const folderCounts = useMemo(
    () =>
      items.reduce((counts, item) => {
        const countedFolderIds = new Set();
        let folder = folders.find((candidate) => candidate.id === item.folderId);

        while (folder && !countedFolderIds.has(folder.id)) {
          countedFolderIds.add(folder.id);
          counts[folder.id] = (counts[folder.id] ?? 0) + 1;
          folder = folder.parentId
            ? folders.find((candidate) => candidate.id === folder.parentId)
            : null;
        }

        return counts;
      }, {}),
    [folders, items],
  );

  function navigateToArea(area) {
    if (!workspaceFeatures.includes(area)) return;
    setActiveArea(area);
    setIsBoardOpen(false);
    setIsSidebarOpen(false);
  }

  async function openWorkspace(authDetails = {}) {
    setAuthError("");
    if (!firebaseAuth) {
      setAuthError("Firebase Web App settings and the Cloud Run API URL are required before sign-in.");
      return;
    }

    setIsAuthenticating(true);
    try {
      const email = authDetails.email.trim();
      const password = authDetails.password;
      const credential = authDetails.mode === "signup"
        ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
        : await signInWithEmailAndPassword(firebaseAuth, email, password);

      if (authDetails.mode === "signup" && authDetails.name.trim()) {
        await updateProfile(credential.user, { displayName: authDetails.name.trim() });
      }
      rememberAccountName(
        credential.user.email || email,
        credential.user.displayName || authDetails.name.trim(),
      );
      setProfile((currentProfile) => ({
        ...currentProfile,
        name: credential.user.displayName || authDetails.name.trim() || currentProfile.name,
        email: credential.user.email || email,
      }));
      setIsWorkspaceOpen(true);
    } catch (error) {
      const authMessages = {
        "auth/email-already-in-use": "An account already exists for this email. Sign in instead.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a password with at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
        "auth/network-request-failed": "Could not reach Firebase. Check your connection and try again.",
      };
      setAuthError(authMessages[error.code] || error.message || "Authentication failed.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function importBrowserWorkspace() {
    if (!legacyImport) return;
    setIsImportingLegacy(true);
    setLegacyImportError("");
    try {
      const workspace = await importLegacyWorkspace(legacyImport);
      setFolders(workspace.folders);
      setItems(workspace.items);
      const [savedProfile, savedCalendar] = await Promise.all([
        loadAccountData("profile"),
        loadAccountData("calendar"),
      ]);
      setProfile((current) => ({
        ...current,
        ...(savedProfile && typeof savedProfile === "object" ? savedProfile : {}),
        email: firebaseAuth.currentUser?.email || "",
      }));
      setCalendarEvents(Array.isArray(savedCalendar?.events) ? savedCalendar.events : []);
      setLegacyImport(null);
    } catch (error) {
      setLegacyImportError(`Could not import browser data: ${error.message}`);
    } finally {
      setIsImportingLegacy(false);
    }
  }

  async function skipBrowserImport() {
    setIsImportingLegacy(true);
    setLegacyImportError("");
    try {
      const workspace = await completeLegacyImport();
      setFolders(workspace.folders);
      setItems(workspace.items);
      setLegacyImport(null);
    } catch (error) {
      setLegacyImportError(`Could not finish setup: ${error.message}`);
    } finally {
      setIsImportingLegacy(false);
    }
  }

  async function saveProfile(nextProfile) {
    try {
      const accountProfile = { ...nextProfile };
      delete accountProfile.email;
      await saveAccountData("profile", accountProfile);
      rememberAccountName(firebaseAuth.currentUser?.email, accountProfile.name);
      setProfile({ ...accountProfile, email: firebaseAuth.currentUser?.email || "" });
      return true;
    } catch (error) {
      console.error("Could not save account profile.", error);
      setStatusMessage(`Could not save profile: ${error.message}`);
      return false;
    }
  }

  if (isFirebaseAuthEnabled && !isAuthReady) {
    return <main className="welcome-auth-loading">Checking your sign-in…</main>;
  }

  if (!isWorkspaceOpen) {
    return (
      <WelcomePage
        theme={theme}
        palette={palette}
        onThemeChange={setTheme}
        onPaletteChange={setPalette}
        onOpenWorkspace={openWorkspace}
        onResetPassword={(email) => sendPasswordResetEmail(firebaseAuth, email)}
        missingSettings={missingWorkspaceSettings}
        isLocalAuthEmulator={isLocalAuthEmulator}
        authError={authError}
        isAuthenticating={isAuthenticating}
        useRealAuthentication={isFirebaseAuthEnabled}
      />
    );
  }

  return (
    <main
      className={`workspace-shell${isWorkspaceOpen && !isBoardOpen ? " has-bottom-nav" : ""}`}
      data-theme={theme}
      data-palette={palette}
      data-area={isBoardOpen ? "whiteboard" : activeArea}
    >
      {legacyImport && (
        <div className="share-modal-backdrop legacy-import-backdrop">
          <section
            className="share-modal legacy-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legacy-import-title"
          >
            <div className="share-modal-icon">
              <FontAwesomeIcon icon={faFileLines} />
            </div>
            <h2 id="legacy-import-title">Import this browser’s workspace?</h2>
            <p>
              This browser has {legacyImport.folders.length} folders, {legacyImport.items.length} documents, and {legacyImport.tasks.length} tasks. {legacyImport.legacyBrowserData.profile ? "A profile" : ""}{legacyImport.legacyBrowserData.calendar ? ", calendar events" : ""}{legacyImport.legacyBrowserData.whiteboard?.objects?.length ? ", and a whiteboard" : ""} can also be imported into your account. The browser copy will remain here.
            </p>
            {legacyImportError && <div className="workspace-alert" role="alert">{legacyImportError}</div>}
            <div className="legacy-import-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={skipBrowserImport}
                disabled={isImportingLegacy}
              >
                Start fresh
              </button>
              <button
                type="button"
                className="primary-action"
                onClick={importBrowserWorkspace}
                disabled={isImportingLegacy}
              >
                {isImportingLegacy ? "Importing…" : "Import workspace"}
              </button>
            </div>
          </section>
        </div>
      )}

      <WorkspaceSidebar
        isOpen={isSidebarOpen}
        activeArea={activeArea}
        roleFeatures={workspaceFeatures}
        onNavigateArea={navigateToArea}
        folders={folders}
        items={items}
        folderCounts={folderCounts}
        selectedFolderId={selectedFolderId}
        isBoardOpen={isBoardOpen}
        selectedItemId={selectedItemId}
        isAddingFolder={isAddingFolder}
        newFolderParentId={newFolderParentId}
        newFolderName={newFolderName}
        dropTargetFolderId={dropTargetFolderId}
        dropPosition={dropPosition}
        isRootDropTarget={isRootDropTarget}
        onClose={() => setIsSidebarOpen(false)}
        onSelectFolder={selectFolder}
        onSelectItem={selectItem}
        onOpenBoard={() => {
          if (!confirmDiscardDraft()) return;
          setIsBoardOpen(true);
          setIsSidebarOpen(false);
        }}
        onCreateFolder={handleCreateFolder}
        onNewFolderNameChange={setNewFolderName}
        onCancelFolderForm={() => {
          setIsAddingFolder(false);
          setNewFolderParentId(null);
          setNewFolderName("");
        }}
        onToggleRootFolderForm={() => {
          const isRootFolderFormOpen =
            isAddingFolder && newFolderParentId === null;
          setNewFolderParentId(null);
          setNewFolderName("");
          setIsAddingFolder(!isRootFolderFormOpen);
        }}
        onStartSubfolder={(folderId) => {
          setNewFolderParentId(folderId);
          setNewFolderName("");
          setIsAddingFolder(true);
        }}
        onDeleteFolder={handleDeleteFolder}
        onRootDragOver={handleRootDragOver}
        onRootDragLeave={() => setIsRootDropTarget(false)}
        onDropRoot={handleDropOnRoot}
        onFolderDragOver={handleFolderDragOver}
        onFolderDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setDropTargetFolderId(null);
            setDropPosition("before");
          }
        }}
        onDropFolder={handleDropOnFolder}
        onDragStart={handleDragStart}
        onDragEnd={() => {
          setDropTargetFolderId(null);
          setDropPosition("before");
          setIsRootDropTarget(false);
        }}
      />

      <section className="workspace-main">
        {isBoardOpen ? (
          <Whiteboard onClose={() => setIsBoardOpen(false)} theme={theme} />
        ) : (
        <div
          className={`workspace-content${isPreparationTrackerFocused ? " is-preparation-focused" : ""}`}
        >
        <WorkspaceHeader
          activeArea={activeArea}
          profile={profile}
          theme={theme}
          palette={palette}
          searchQuery={searchQuery}
          searchInputRef={searchInputRef}
          folderName={activeArea === "employee" ? activeFolder?.name : undefined}
          visibleItemCount={visibleItems.length}
          isLoading={isLoading}
          canUpload={
            workspaceFeatures.includes("upload") &&
            activeArea === "employee" &&
            folders.length > 0
          }
          fileInputRef={fileInputRef}
          replaceFileInputRef={replaceFileInputRef}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query.trim() && activeArea !== "employee") {
              navigateToArea("employee");
            }
          }}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onThemeChange={setTheme}
          onPaletteChange={setPalette}
          onOpenSignout={() => setIsSignoutInfoOpen(true)}
          onOpenProfile={() => navigateToArea("profile")}
          onUpload={handleUpload}
          onReplaceFile={handleReplaceFile}
          onNewNote={startNewNote}
          notifications={notifications}
          browserNotificationPermission={browserNotificationPermission}
          areBrowserRemindersEnabled={areBrowserRemindersEnabled}
          onToggleBrowserReminders={toggleBrowserReminders}
          onOpenNotification={(notification) => {
            if (notification.date) {
              setRequestedCalendarDate({ date: notification.date, requestId: createId() });
              navigateToArea("calendar");
              return;
            }
            navigateToArea(notification.targetArea ?? "employee");
          }}
        />

          {activeArea === "sticky-notes" ? (
            <StickyNotes />
          ) : activeArea === "employee" ? (
            <>
              {storageError && (
                <div className="workspace-alert" role="alert">
                  {storageError}
                </div>
              )}
              {statusMessage && (
                <div className="workspace-status" role="status" aria-live="polite">
                  <span>{statusMessage}</span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Dismiss message"
                    onClick={() => setStatusMessage("")}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              )}
              {isLoading ? (
            <div className="workspace-empty-state">Loading your workspace…</div>
          ) : storageError ? (
            <div className="workspace-empty-state">
              Check your connection and reload the workspace.
            </div>
          ) : (
            <div
              className={`workspace-grid${isPreparationTrackerFocused ? " is-preparation-focused" : ""}`}
            >
              {!isPreparationTrackerFocused && (
                <DocumentList
                  visibleItems={visibleItems}
                  folders={folders}
                  selectedItemId={selectedItemId}
                  searchQuery={searchQuery}
                  onSelectItem={selectItem}
                  onDeleteItem={handleDeleteItem}
                  onDragStart={handleDragStart}
                  onDragEnd={() => {
                    setDropTargetFolderId(null);
                    setDropPosition("before");
                    setIsRootDropTarget(false);
                  }}
                />
              )}

              <section
                className={`editor-panel${isPreparationTrackerFocused ? " is-preparation-focused" : ""}`}
                aria-label="Document editor"
              >
                {isCreatingNote || activeItem?.kind === "note" ? (
                  <NoteEditor
                    activeItem={activeItem}
                    isCreatingNote={isCreatingNote}
                    isTrainingPreparation={draftPurpose === "training"}
                    isPreparationTrackerFocused={isPreparationTrackerFocused}
                    draftTitle={draftTitle}
                    draftContent={draftContent}
                    draftFolderId={draftFolderId}
                    draftTopics={draftTopics}
                    boardStrokes={draftBoardStrokes}
                    draggedTopicId={draggedTopicId}
                    topicDropTarget={topicDropTarget}
                    isDraftDirty={isDraftDirty}
                    folders={folders}
                    onSave={handleSaveNote}
                    onDelete={() => handleDeleteItem()}
                    onShowDocuments={() => setIsDocumentListHidden(false)}
                    onTitleChange={setDraftTitle}
                    onFolderChange={setDraftFolderId}
                    onContentChange={setDraftContent}
                    onBoardStrokesChange={setDraftBoardStrokes}
                    onAddTopic={addPreparationTopic}
                    onUpdateTopic={updatePreparationTopic}
                    onRemoveTopic={removePreparationTopic}
                    onTogglePinned={setPreparationTopicPinned}
                    onMoveTopic={movePreparationTopic}
                    onTopicDragStart={handleTopicDragStart}
                    onTopicDragOver={handleTopicDragOver}
                    onTopicDrop={handleTopicDrop}
                    onTopicDragEnd={() => {
                      draggedTopicIdRef.current = null;
                      setDraggedTopicId(null);
                      setTopicDropTarget(null);
                    }}
                    onTopicDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setTopicDropTarget(null);
                      }
                    }}
                  />
                ) : activeItem?.kind === "file" ? (
                  <FileDetails
                    item={activeItem}
                    folderName={selectedFolder?.name}
                    previewType={activeFilePreviewType}
                    previewUrl={filePreviewUrl}
                    previewSearch={previewSearch}
                    searchMatchCount={fileSearchMatchCount}
                    previewZoom={previewZoom}
                    isEditing={isEditingFile}
                    isExternalEditActive={isExternalEditActive}
                    isDraftDirty={isFileDraftDirty}
                    fileDraftContent={fileDraftContent}
                    fileDocumentText={fileDocumentText}
                    isLoadingFileDocument={isLoadingFileDocument}
                    isRenderingDocx={isRenderingDocx}
                    isFileViewerOpen={isFileViewerOpen}
                    docxPreviewRef={docxPreviewRef}
                    onReplaceMissingFile={() => replaceFileInputRef.current?.click()}
                    onDelete={() => handleDeleteItem()}
                    onEdit={handleEditFile}
                    onSaveEditedCopy={() => replaceFileInputRef.current?.click()}
                    onPreviewSearchChange={setPreviewSearch}
                    onZoomChange={setPreviewZoom}
                    onResetZoom={() => setPreviewZoom(100)}
                    onToggleFullView={() => setIsFileViewerOpen((open) => !open)}
                    onCancelEdit={cancelFileEdit}
                    onSaveEdit={handleSaveFile}
                    onFileContentChange={setFileDraftContent}
                    onFileEditorKeyDown={handleFileEditorKeyDown}
                    onDownload={handleDownload}
                  />
                ) : (
                  <div className="editor-empty-state">
                    <div className="editor-empty-orbit">
                      <FontAwesomeIcon icon={faFileLines} />
                    </div>
                    <h2>Your ideas, in one place</h2>
                    <p>
                      Select a document to view it, or create a note to start
                      planning your next step.
                    </p>
                    <button
                      type="button"
                      className="save-note-button"
                      onClick={startNewNote}
                      disabled={folders.length === 0}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Create a note
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
            </>
          ) : activeArea === "calendar" ? (
            <PreparationCalendar
              profile={profile}
              navigationRequest={requestedCalendarDate}
              onEventsChange={setCalendarEvents}
              onIssueChange={setCalendarIssue}
            />
          ) : activeArea === "profile" ? (
            <UserProfile key={`${profile.email}:${profile.name}`} profile={profile} onSave={saveProfile} />
          ) : (
            <CompanyHub
              view={activeArea}
              itemCount={items.length}
              userName={profile.name || firebaseAuth.currentUser?.displayName || ""}
              onOpenDocuments={() => navigateToArea("employee")}
              onStartTraining={() =>
                startNewNote({ title: "Training preparation", purpose: "training" })
              }
              onOpenBoard={() => {
                if (!confirmDiscardDraft()) return;
                setIsBoardOpen(true);
              }}
            />
          )}
        </div>
        )}
      </section>

      {!isBoardOpen && (
        <WorkspaceBottomNav
          activeArea={activeArea}
          isBoardOpen={isBoardOpen}
          roleFeatures={workspaceFeatures}
          onNavigate={navigateToArea}
          onOpenBoard={() => {
            if (!confirmDiscardDraft()) return;
            setIsBoardOpen(true);
            setIsSidebarOpen(false);
          }}
        />
      )}

      <AssistantPanel
        isOpen={isAssistantOpen}
        activeItem={activeItem}
        assistantModelState={assistantModelState}
        assistantModelProgress={assistantModelProgress}
        assistantMessages={assistantMessages}
        isAssistantLoading={isAssistantLoading}
        assistantError={assistantError}
        assistantInput={assistantInput}
        messagesEndRef={assistantMessagesEndRef}
        inputRef={assistantInputRef}
        onOpen={() => setIsAssistantOpen(true)}
        onClose={() => setIsAssistantOpen(false)}
        onRetry={handleRetryAssistant}
        onAsk={handleAskAssistant}
        onInputChange={(event) => setAssistantInput(event.target.value)}
        onSuggestion={(suggestion) => {
          setAssistantInput(suggestion);
          assistantInputRef.current?.focus();
        }}
      />

      {isSignoutInfoOpen && (
        <div
          className="share-modal-backdrop"
          onClick={() => setIsSignoutInfoOpen(false)}
        >
          <section
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button share-modal-close"
              aria-label="Close sign-out information"
              onClick={() => setIsSignoutInfoOpen(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <div className="share-modal-icon">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </div>
            <h2 id="signout-modal-title">Sign out of this workspace?</h2>
            <p>
              Your documents, tasks, calendar, whiteboard, and profile remain saved to your account after you sign out. Theme preferences are kept on this device.
            </p>
            <button
              type="button"
              className="save-note-button"
              onClick={async () => {
                setIsSignoutInfoOpen(false);
                if (firebaseAuth) {
                  try {
                    await signOut(firebaseAuth);
                  } catch (error) {
                    setAuthError(`Could not sign out: ${error.message}`);
                  }
                }
              }}
            >
              Sign out
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default WorkspaceApp;
