import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faBars,
  faCircleUser,
  faMagnifyingGlass,
  faMoon,
  faPlus,
  faRightFromBracket,
  faShareNodes,
  faSun,
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
  canShare,
  fileInputRef,
  replaceFileInputRef,
  onSearchChange,
  onOpenSidebar,
  onOpenSharing,
  onThemeChange,
  onPaletteChange,
  onOpenSignout,
  onOpenProfile,
  onUpload,
  onReplaceFile,
  onNewNote,
}) {
  const isEmployeeArea = activeArea === "employee";
  const pageTitle =
    activeArea === "company"
      ? "Company overview"
      : activeArea === "company-resources"
        ? "Company resources"
        : activeArea === "team-admin"
          ? "Manage team & roles"
            : activeArea === "calendar"
              ? "Preparation calendar"
              : activeArea === "profile"
                ? "My profile"
        : activeArea === "training"
        ? "Training & learning"
        : folderName ?? "All documents";
  const searchLabel =
    isEmployeeArea ? "Search notes and files" : "Search notes and files in employee workspace";

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
        {canShare && <button
          type="button"
          className="share-button"
          onClick={onOpenSharing}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          <span>Sharing</span>
        </button>}
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
          <span className="workspace-overline">VSR GROUP OF COMPANIES · PROTOTYPE</span>
          <h1>{isEmployeeArea && searchQuery ? "Search results" : pageTitle}</h1>
          <p>
            {isEmployeeArea && searchQuery
              ? `${visibleItemCount} matching item${visibleItemCount === 1 ? "" : "s"}`
              : activeArea === "company"
                ? "Company information and shared work, together."
                : activeArea === "company-resources"
                  ? "Policies, guides, and onboarding resources."
                  : activeArea === "team-admin"
                    ? "Admin-only controls shown with sample data."
                    : activeArea === "calendar"
                      ? "Plan study sessions, training, and preparation milestones."
                      : activeArea === "profile"
                        ? "Manage the demo identity shown on your learning comments."
                : activeArea === "training"
                  ? "Prepare, learn, and capture your next steps."
                  : "Keep your documents and preparation organized."}
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
