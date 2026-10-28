import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faBars,
  faMagnifyingGlass,
  faMoon,
  faPlus,
  faRightFromBracket,
  faShareNodes,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { palettes } from "../../../lib/workspaceConfig.js";

function WorkspaceHeader({
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
  onOpenSharing,
  onThemeChange,
  onPaletteChange,
  onOpenSignout,
  onUpload,
  onReplaceFile,
  onNewNote,
}) {
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
            placeholder="Search notes and files"
            aria-label="Search notes and files"
          />
          <kbd>Ctrl / ⌘ K</kbd>
        </label>
        <button
          type="button"
          className="share-button"
          onClick={onOpenSharing}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          <span>Sharing</span>
        </button>
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
          <span className="workspace-overline">LOCAL WORKSPACE · NOT SECURE STORAGE</span>
          <h1>{searchQuery ? "Search results" : folderName ?? "All documents"}</h1>
          <p>
            {searchQuery
              ? `${visibleItemCount} matching item${visibleItemCount === 1 ? "" : "s"}`
              : "Keep your preparation organized and moving forward."}
          </p>
        </div>
        <div className="workspace-actions">
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
        </div>
      </div>
    </>
  );
}

export default WorkspaceHeader;
