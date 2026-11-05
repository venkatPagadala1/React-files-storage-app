import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faBars,
  faBell,
  faCalendarDay,
  faCalendarDays,
  faCircleCheck,
  faCircleUser,
  faFileLines,
  faFolderOpen,
  faMagnifyingGlass,
  faMoon,
  faNoteSticky,
  faPlus,
  faRightFromBracket,
  faSun,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { palettes } from "../../../lib/workspaceConfig.js";

function WorkspaceHeader({
  activeArea,
  profile,
  theme,
  palette,
  searchQuery,
  searchResults = [],
  isSearchLoading = false,
  searchError = "",
  searchInputRef,
  folderName,
  visibleItemCount,
  isLoading,
  canUpload,
  fileInputRef,
  replaceFileInputRef,
  onSearchChange,
  onOpenSidebar,
  onThemeChange,
  onPaletteChange,
  onOpenSignout,
  onOpenProfile,
  onUpload,
  onReplaceFile,
  onNewNote,
  onSelectSearchResult,
  notifications = [],
  browserNotificationPermission = "unsupported",
  areBrowserRemindersEnabled = false,
  onToggleBrowserReminders,
  onOpenNotification,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const notificationRef = useRef(null);
  const isSearchActive = isGlobalSearchOpen && Boolean(searchQuery.trim());
  const isEmployeeArea = activeArea === "employee";
  const pageTitle = {
    company: "Your workspace",
    calendar: "Preparation calendar",
    profile: "My profile",
    training: "Learning notes",
    "sticky-notes": "Sticky notes",
  }[activeArea] ?? folderName ?? "All documents";
  const pageDescription = {
    company: "Your private workspace, organized in one place.",
    calendar: "Plan study sessions, training, and preparation milestones.",
    profile: "Manage your account profile.",
    training: "Prepare, learn, and capture your next steps.",
    "sticky-notes": "Capture quick tasks and check them off as you go.",
  }[activeArea] ?? "Keep your documents and preparation organized.";
  const searchLabel = "Search everything...";

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;
    function closeOnOutsideClick(event) {
      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setIsNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isNotificationsOpen]);

  return (
    <>
      <header className="workspace-topbar sticky top-0 z-[5] flex min-h-[72px] items-center gap-3 border-b border-gray-200 bg-white/92 px-[clamp(24px,3.2vw,48px)] backdrop-blur-md">
        <button
          type="button"
          className="topbar-menu-button inline-grid h-[34px] w-[34px] flex-[0_0_34px] cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent p-0 text-gray-500 transition-[background,color] duration-[140ms] hover:bg-gray-100 hover:text-teal-600"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div
          className="workspace-global-search"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsGlobalSearchOpen(false);
            }
          }}
        >
          <label className="workspace-search flex h-[42px] min-w-0 items-center gap-[10px] rounded-[11px] border border-gray-200 bg-gray-50 px-[13px]">
            <FontAwesomeIcon className="text-[.78rem]" icon={faMagnifyingGlass} />
            <input
              ref={searchInputRef}
              type="search"
              className="min-w-0 flex-1 border-0 bg-transparent text-[.88rem] font-[inherit] outline-0"
              value={searchQuery}
              onFocus={() => setIsGlobalSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsGlobalSearchOpen(false);
              }}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchLabel}
              aria-label={searchLabel}
              aria-expanded={isSearchActive}
              aria-controls="workspace-global-search-results"
              aria-autocomplete="list"
            />
            <kbd className="rounded-[5px] border border-gray-200 bg-gray-100 px-[5px] py-[3px] text-[.68rem]">Ctrl / ⌘ K</kbd>
          </label>
          {isSearchActive && (
            <section
              className="workspace-global-search-results"
              id="workspace-global-search-results"
              aria-label="Search results across your workspace"
              aria-live="polite"
            >
              <div className="workspace-global-search-heading">
                <span>Workspace search</span>
                <span>{searchResults.length} {searchResults.length === 1 ? "match" : "matches"}</span>
              </div>
              {searchError && <p className="workspace-global-search-error" role="status">{searchError}</p>}
              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map((result) => {
                    const icon = {
                      document: faFileLines,
                      folder: faFolderOpen,
                      task: faNoteSticky,
                      calendar: faCalendarDays,
                      profile: faCircleUser,
                    }[result.type] ?? faMagnifyingGlass;
                    return (
                      <li key={`${result.type}:${result.id}`}>
                        <button
                          type="button"
                          className="workspace-global-search-result"
                          onClick={() => {
                            onSelectSearchResult?.(result);
                            setIsGlobalSearchOpen(false);
                          }}
                        >
                          <span className="workspace-global-search-result-icon">
                            <FontAwesomeIcon icon={icon} />
                          </span>
                          <span className="workspace-global-search-result-copy">
                            <strong>{result.title}</strong>
                            <span>{result.detail}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="workspace-global-search-empty">
                  {isSearchLoading ? "Searching your workspace…" : "No matching items found."}
                </p>
              )}
              {isSearchLoading && searchResults.length > 0 && (
                <p className="workspace-global-search-loading">Checking task notes…</p>
              )}
            </section>
          )}
        </div>
        <div className="workspace-header-actions">
        <div className="relative shrink-0" ref={notificationRef}>
          <button
            type="button"
            className={`topbar-tool-button inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-gray-50 px-[11px] text-[.82rem] font-bold text-gray-700 relative transition border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600${isNotificationsOpen ? " is-open" : ""}`}
            onClick={() => setIsNotificationsOpen((open) => !open)}
            aria-label={`Notifications${notifications.length ? `, ${notifications.length} updates` : ""}`}
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            title="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            <span className="topbar-button-label">Notifications</span>
            {notifications.length > 0 && (
              <span className="absolute -top-[6px] -right-[6px] grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[.62rem] font-extrabold leading-none text-white" aria-hidden="true">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <section className="notification-panel absolute top-[calc(100%_+_12px)] right-0 z-40 w-[min(360px,calc(100vw_-_24px))] overflow-hidden rounded-[17px] border border-[var(--workspace-border)] bg-[var(--ui-surface)] text-[var(--workspace-ink)]" role="dialog" aria-label="Notifications">
              <div className="notification-panel-heading flex items-center justify-between gap-4 border-b border-[var(--workspace-border)] px-[18px] pt-[17px] pb-[15px]">
                <div className="grid gap-[3px]">
                  <strong className="text-[.94rem] tracking-[-.02em]">Notifications</strong>
                  <span className="text-[.72rem]">
                    {notifications.length
                      ? `${notifications.length} upcoming ${notifications.length === 1 ? "event or issue" : "events or issues"}`
                      : "You’re all caught up"}
                  </span>
                </div>
                <span className="notification-heading-icon grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px]">
                  <FontAwesomeIcon icon={faBell} />
                </span>
              </div>
              {notifications.length ? (
                <ul className="notification-list m-0 max-h-[min(390px,55vh)] list-none overflow-y-auto p-[7px]">
                  {notifications.map((notification) => {
                    const NotificationIcon = notification.kind === "event"
                      ? faCalendarDay
                      : faTriangleExclamation;
                    const content = (
                      <>
                        <span className={`notification-icon grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[.8rem] is-${notification.kind}`}>
                          <FontAwesomeIcon icon={NotificationIcon} />
                        </span>
                        <span className="notification-copy grid min-w-0 flex-1 gap-[3px]">
                          <strong className="overflow-hidden text-ellipsis text-[.77rem] font-[720]">{notification.title}</strong>
                          <span className="line-clamp-2 overflow-hidden text-[.7rem] leading-[1.45]">{notification.detail}</span>
                        </span>
                        <span className="notification-open-indicator ml-auto self-center text-[1.25rem] leading-none" aria-hidden="true">›</span>
                      </>
                    );
                    return (
                      <li key={notification.id}>
                        <button
                          type="button"
                          className="notification-item flex min-h-[66px] w-full cursor-pointer items-start gap-[11px] rounded-[11px] border-0 bg-transparent p-[10px] text-left font-[inherit] text-inherit"
                          onClick={() => {
                            onOpenNotification?.(notification);
                            setIsNotificationsOpen(false);
                          }}
                        >
                          {content}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="notification-empty grid min-h-[132px] content-center justify-items-center gap-[9px] px-[18px] py-[22px] text-center">
                  <FontAwesomeIcon className="text-[1.15rem]" icon={faCircleCheck} />
                  <p className="m-0 text-[.76rem]">No issues or events in the next 7 days.</p>
                </div>
              )}
              <div className="notification-panel-footer flex flex-wrap items-center justify-between gap-2 border-t border-[var(--workspace-border)] px-[13px] pt-[10px] pb-3">
                <div className="notification-reminder-setting flex w-full items-center justify-between gap-[10px] border-b border-[color-mix(in_srgb,var(--workspace-border)_70%,transparent)] pb-[9px]">
                  <p className="notification-footnote m-0 flex-[1_1_auto] text-[.64rem] leading-[1.45]">
                    {browserNotificationPermission === "unsupported"
                      ? "This browser does not support desktop alerts."
                      : browserNotificationPermission === "denied"
                        ? "Desktop alerts are blocked in browser settings."
                        : areBrowserRemindersEnabled
                          ? "Event alerts are on. You’ll be reminded 10 minutes before an event while the app is open."
                          : "Turn on desktop alerts for a reminder 10 minutes before each event."}
                  </p>
                  {browserNotificationPermission !== "unsupported" && browserNotificationPermission !== "denied" && (
                    <button
                      type="button"
                      className="notification-reminder-toggle min-h-8 shrink-0 rounded-[9px] border border-[color-mix(in_srgb,var(--workspace-accent)_30%,var(--workspace-border))] bg-[color-mix(in_srgb,var(--workspace-accent-soft)_64%,var(--ui-surface))] px-[10px] text-[.68rem] font-[750] font-[inherit]"
                      onClick={onToggleBrowserReminders}
                    >
                      {areBrowserRemindersEnabled ? "Turn off" : "Enable alerts"}
                    </button>
                  )}
                </div>
                <p className="notification-footnote m-0 flex-[1_1_135px] text-[.64rem] leading-[1.45]">Reminders use your account calendar.</p>
                <button
                  type="button"
                  className="notification-calendar-link inline-flex min-h-[34px] items-center justify-center gap-[7px] rounded-[9px] border border-[color-mix(in_srgb,var(--workspace-accent)_27%,var(--workspace-border))] bg-[color-mix(in_srgb,var(--workspace-accent-soft)_64%,var(--ui-surface))] px-[10px] text-[.72rem] font-bold font-[inherit]"
                  onClick={() => {
                    onOpenNotification?.({ targetArea: "calendar" });
                    setIsNotificationsOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCalendarDays} />
                  <span>Open calendar</span>
                </button>
              </div>
            </section>
          )}
        </div>
        <button
          type="button"
          className="topbar-tool-button inline-flex min-h-10 cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-gray-200 bg-gray-50 px-[10px] text-[.82rem] font-bold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
          <span className="topbar-button-label">{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>
        <label className="palette-picker workspace-palette-picker min-h-10 rounded-[10px] flex items-center border border-gray-200 bg-gray-50 px-2 text-[.82rem] gap-2">
          <span className="palette-picker-label">Theme</span>
          <select
            value={palette}
            onChange={(event) => onPaletteChange(event.target.value)}
            aria-label="Choose color theme"
            className="bg-transparent font-medium focus:outline-none"
          >
            {palettes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="topbar-tool-button inline-flex min-h-10 cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-gray-200 bg-gray-50 px-[10px] text-[.82rem] font-bold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          onClick={onOpenProfile}
          aria-label="Open my profile"
          title="Open my profile"
        >
          {profile?.avatar ? (
            <img className="h-5 w-5 rounded-full object-cover" src={profile.avatar} alt="" />
          ) : (
            <FontAwesomeIcon icon={faCircleUser} />
          )}
          <span className="topbar-button-label">Profile</span>
        </button>
        <button
          type="button"
          className="topbar-tool-button signout-button inline-flex min-h-10 cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-gray-200 bg-gray-50 px-[10px] text-[.82rem] font-bold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          onClick={onOpenSignout}
          aria-label="Sign out"
          title="Sign out"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span className="topbar-button-label">Sign out</span>
        </button>
        </div>
      </header>

      <div className="mb-[30px] flex items-center justify-between gap-6">
        <div>
          <span className="text-gray-400 text-[.72rem] font-bold tracking-[.12em]">VSR WORKSPACE</span>
          <h1 className="mt-2 text-[clamp(1.8rem,2.8vw,2.25rem)] font-bold leading-[1.16] tracking-[-.045em]">{isEmployeeArea && searchQuery ? "Search results" : pageTitle}</h1>
          <p className="mt-[9px] max-w-[680px] text-[.95rem] leading-[1.55] text-gray-600">
            {isEmployeeArea && searchQuery
              ? `${visibleItemCount} matching item${visibleItemCount === 1 ? "" : "s"}`
              : pageDescription}
          </p>
        </div>
        {isEmployeeArea && <div className="flex gap-2">
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            onChange={onUpload}
          />
          <input
            ref={replaceFileInputRef}
            className="hidden"
            type="file"
            onChange={onReplaceFile}
          />
          <button
            type="button"
            className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-gray-300 bg-white px-3 text-[.75rem] font-bold text-gray-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !canUpload}
          >
            <FontAwesomeIcon icon={faArrowUpFromBracket} />
            <span>Upload file</span>
          </button>
          <button
            type="button"
            className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-teal-600 bg-teal-600 px-3 text-[.75rem] font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            onClick={onNewNote}
            disabled={isLoading || !canUpload}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>New note</span>
          </button>
        </div>}
      </div>
    </>
  );
}

export default WorkspaceHeader;
