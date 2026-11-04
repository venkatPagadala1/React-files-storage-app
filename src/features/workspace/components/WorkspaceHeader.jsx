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
  faMagnifyingGlass,
  faMoon,
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
  notifications = [],
  browserNotificationPermission = "unsupported",
  areBrowserRemindersEnabled = false,
  onToggleBrowserReminders,
  onOpenNotification,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
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
  const searchLabel =
    isEmployeeArea ? "Search notes and files" : "Search notes and files in employee workspace";

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
      <header className="workspace-topbar">
        <button
          type="button"
          className="icon-button menu-button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <label className="workspace-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
          />
          <kbd>Ctrl / ⌘ K</kbd>
        </label>
        <div className="notification-center" ref={notificationRef}>
          <button
            type="button"
            className={`topbar-tool-button notification-trigger${isNotificationsOpen ? " is-open" : ""}`}
            onClick={() => setIsNotificationsOpen((open) => !open)}
            aria-label={`Notifications${notifications.length ? `, ${notifications.length} updates` : ""}`}
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            title="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            <span>Notifications</span>
            {notifications.length > 0 && (
              <span className="notification-count" aria-hidden="true">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <section className="notification-panel" role="dialog" aria-label="Notifications">
              <div className="notification-panel-heading">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    {notifications.length
                      ? `${notifications.length} upcoming ${notifications.length === 1 ? "event or issue" : "events or issues"}`
                      : "You’re all caught up"}
                  </span>
                </div>
                <span className="notification-heading-icon">
                  <FontAwesomeIcon icon={faBell} />
                </span>
              </div>
              {notifications.length ? (
                <ul className="notification-list">
                  {notifications.map((notification) => {
                    const NotificationIcon = notification.kind === "event"
                      ? faCalendarDay
                      : faTriangleExclamation;
                    const content = (
                      <>
                        <span className={`notification-icon is-${notification.kind}`}>
                          <FontAwesomeIcon icon={NotificationIcon} />
                        </span>
                        <span className="notification-copy">
                          <strong>{notification.title}</strong>
                          <span>{notification.detail}</span>
                        </span>
                        <span className="notification-open-indicator" aria-hidden="true">›</span>
                      </>
                    );
                    return (
                      <li key={notification.id}>
                        <button
                          type="button"
                          className="notification-item"
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
                <div className="notification-empty">
                  <FontAwesomeIcon icon={faCircleCheck} />
                  <p>No issues or events in the next 7 days.</p>
                </div>
              )}
              <div className="notification-panel-footer">
                <div className="notification-reminder-setting">
                  <p className="notification-footnote">
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
                      className="notification-reminder-toggle"
                      onClick={onToggleBrowserReminders}
                    >
                      {areBrowserRemindersEnabled ? "Turn off" : "Enable alerts"}
                    </button>
                  )}
                </div>
                <p className="notification-footnote">Reminders use your account calendar.</p>
                <button
                  type="button"
                  className="notification-calendar-link"
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
          className="topbar-tool-button"
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>
        <label className="palette-picker workspace-palette-picker">
          <span>Theme</span>
          <select
            value={palette}
            onChange={(event) => onPaletteChange(event.target.value)}
            aria-label="Choose color theme"
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
          className="topbar-tool-button profile-shortcut"
          onClick={onOpenProfile}
          aria-label="Open my profile"
          title="Open my profile"
        >
          {profile?.avatar ? (
            <img className="profile-shortcut-avatar" src={profile.avatar} alt="" />
          ) : (
            <FontAwesomeIcon icon={faCircleUser} />
          )}
          <span>Profile</span>
        </button>
        <button
          type="button"
          className="topbar-tool-button signout-button"
          onClick={onOpenSignout}
          aria-label="Sign out"
          title="Sign out"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Sign out</span>
        </button>
      </header>

      <div className="workspace-heading">
        <div>
          <span className="workspace-overline">VSR WORKSPACE</span>
          <h1>{isEmployeeArea && searchQuery ? "Search results" : pageTitle}</h1>
          <p>
            {isEmployeeArea && searchQuery
              ? `${visibleItemCount} matching item${visibleItemCount === 1 ? "" : "s"}`
              : pageDescription}
          </p>
        </div>
        {isEmployeeArea && <div className="workspace-actions">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            onChange={onUpload}
          />
          <input
            ref={replaceFileInputRef}
            className="visually-hidden"
            type="file"
            onChange={onReplaceFile}
          />
          <button
            type="button"
            className="secondary-action"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !canUpload}
          >
            <FontAwesomeIcon icon={faArrowUpFromBracket} />
            <span>Upload file</span>
          </button>
          <button
            type="button"
            className="primary-action"
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
