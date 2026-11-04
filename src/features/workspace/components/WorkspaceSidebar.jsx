import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faBookOpen,
  faBuilding,
  faCalendarDays,
  faChalkboard,
  faCircleUser,
  faFileLines,
  faFolder,
  faFolderPlus,
  faNoteSticky,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { VsrLogoMark, VsrWordmark } from "../../../components/branding/VsrBrand.jsx";
import { getSiblingFolders } from "../../../lib/workspaceUtils.js";

function NewFolderForm({
  isSubfolder,
  name,
  onNameChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="new-folder-form" onSubmit={onSubmit}>
      <input
        autoFocus
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={isSubfolder ? "Subfolder name" : "Folder name"}
        aria-label={isSubfolder ? "New subfolder name" : "New folder name"}
        maxLength={40}
      />
      <button type="submit" aria-label="Save folder">
        <FontAwesomeIcon icon={faFolderPlus} />
      </button>
      <button
        type="button"
        className="new-folder-cancel"
        aria-label="Cancel folder creation"
        onClick={onCancel}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </form>
  );
}

function FolderTree({
  parentId = null,
  depth = 0,
  folders,
  items,
  folderCounts,
  selectedFolderId,
  selectedItemId,
  isAddingFolder,
  newFolderParentId,
  newFolderName,
  dropTargetFolderId,
  dropPosition,
  onSelectFolder,
  onSelectItem,
  onCreateFolder,
  onNewFolderNameChange,
  onCancelFolderForm,
  onStartSubfolder,
  onDeleteFolder,
  onFolderDragOver,
  onFolderDragLeave,
  onDropFolder,
  onDragStart,
  onDragEnd,
}) {
  if (depth > folders.length) return null;

  return getSiblingFolders(folders, parentId).map((folder) => {
    const folderItems = items
      .filter((item) => item.folderId === folder.id)
      .sort((first, second) => second.updatedAt - first.updatedAt);
    const isCreatingSubfolder =
      isAddingFolder && newFolderParentId === folder.id;

    return (
      <div className="folder-group" key={folder.id}>
        <div
          className={`folder-row ${dropTargetFolderId === folder.id ? `is-drop-target drop-${dropPosition}` : ""}`}
          style={{ paddingLeft: `${depth * 14}px` }}
          onDragOver={(event) => onFolderDragOver(event, folder.id)}
          onDragLeave={onFolderDragLeave}
          onDrop={(event) => onDropFolder(event, folder.id)}
        >
          <button
            type="button"
            className={`sidebar-link ${selectedFolderId === folder.id ? "active" : ""}`}
            onClick={() => onSelectFolder(folder.id)}
            draggable
            onDragStart={(event) =>
              onDragStart(event, { type: "folder", id: folder.id })
            }
            onDragEnd={onDragEnd}
            title={`Drag ${folder.name} onto a sibling folder to reorder it`}
          >
            <FontAwesomeIcon icon={faFolder} style={{ color: folder.color }} />
            <span className="folder-label">{folder.name}</span>
            <span className="sidebar-count">{folderCounts[folder.id] ?? 0}</span>
          </button>
          <button
            type="button"
            className="icon-button folder-add-child-button"
            aria-label={`Create subfolder in ${folder.name}`}
            title={`Create subfolder in ${folder.name}`}
            onClick={() => onStartSubfolder(folder.id)}
          >
            <FontAwesomeIcon icon={faFolderPlus} />
          </button>
          <button
            type="button"
            className="icon-button folder-delete-button"
            aria-label={`Delete ${folder.name} folder`}
            title={`Delete ${folder.name}`}
            onClick={() => onDeleteFolder(folder)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
        {isCreatingSubfolder && (
          <NewFolderForm
            isSubfolder
            name={newFolderName}
            onNameChange={onNewFolderNameChange}
            onSubmit={onCreateFolder}
            onCancel={onCancelFolderForm}
          />
        )}
        {folderItems.length > 0 && (
          <div
            className="folder-document-list"
            aria-label={`${folder.name} documents`}
            style={{ marginLeft: `${depth * 14}px` }}
          >
            {folderItems.map((item) => (
              <button
                type="button"
                className={`folder-document-link ${selectedItemId === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => onSelectItem(item)}
                draggable
                onDragStart={(event) =>
                  onDragStart(event, { type: "item", id: item.id })
                }
                onDragEnd={onDragEnd}
                aria-current={selectedItemId === item.id ? "page" : undefined}
                title={item.title}
              >
                <FontAwesomeIcon
                  icon={item.kind === "file" ? faArrowUpFromBracket : faFileLines}
                  aria-hidden="true"
                />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        )}
        <FolderTree
          parentId={folder.id}
          depth={depth + 1}
          folders={folders}
          items={items}
          folderCounts={folderCounts}
          selectedFolderId={selectedFolderId}
          selectedItemId={selectedItemId}
          isAddingFolder={isAddingFolder}
          newFolderParentId={newFolderParentId}
          newFolderName={newFolderName}
          dropTargetFolderId={dropTargetFolderId}
          dropPosition={dropPosition}
          onSelectFolder={onSelectFolder}
          onSelectItem={onSelectItem}
          onCreateFolder={onCreateFolder}
          onNewFolderNameChange={onNewFolderNameChange}
          onCancelFolderForm={onCancelFolderForm}
          onStartSubfolder={onStartSubfolder}
          onDeleteFolder={onDeleteFolder}
          onFolderDragOver={onFolderDragOver}
          onFolderDragLeave={onFolderDragLeave}
          onDropFolder={onDropFolder}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </div>
    );
  });
}

function WorkspaceSidebar({
  isOpen,
  folders,
  items,
  folderCounts,
  selectedFolderId,
  activeArea,
  roleFeatures,
  isBoardOpen,
  selectedItemId,
  isAddingFolder,
  newFolderParentId,
  newFolderName,
  dropTargetFolderId,
  dropPosition,
  isRootDropTarget,
  onClose,
  onSelectFolder,
  onNavigateArea,
  onOpenBoard,
  onSelectItem,
  onCreateFolder,
  onNewFolderNameChange,
  onCancelFolderForm,
  onToggleRootFolderForm,
  onStartSubfolder,
  onDeleteFolder,
  onRootDragOver,
  onRootDragLeave,
  onDropRoot,
  onFolderDragOver,
  onFolderDragLeave,
  onDropFolder,
  onDragStart,
  onDragEnd,
}) {
  const isRootFolderFormOpen = isAddingFolder && newFolderParentId === null;
  const canView = (feature) => roleFeatures.includes(feature);

  return (
    <aside className={`workspace-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="workspace-brand">
        <div className="workspace-brand-mark">
          <VsrLogoMark />
        </div>
        <div>
          <strong className="workspace-brand-name">
            <VsrWordmark className="workspace-brand-wordmark" />
            <span>GROUP</span>
          </strong>
          <span>VSR Group of Companies</span>
        </div>
        <button
          type="button"
          className="icon-button sidebar-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <nav className="workspace-area-navigation" aria-label="Workspace areas">
        {canView("company") && (
          <section className="workspace-nav-group" aria-label="Company">
            <h2 className="workspace-nav-group-title">Company</h2>
            <button
              type="button"
              className={`sidebar-link ${activeArea === "company" && !isBoardOpen ? "active" : ""}`}
              onClick={() => onNavigateArea("company")}
              aria-current={activeArea === "company" ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faBuilding} />
              <span>Overview</span>
            </button>
          </section>
        )}

        {canView("employee") && (
          <section className="workspace-nav-group" aria-label="My workspace">
            <h2 className="workspace-nav-group-title">My workspace</h2>
            <button
              type="button"
              className={`sidebar-link ${activeArea === "employee" && !isBoardOpen ? "active" : ""}`}
              onClick={() => onSelectFolder("all")}
              aria-current={activeArea === "employee" && !isBoardOpen ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faFileLines} />
              <span>Documents</span>
              <span className="sidebar-count">{items.length}</span>
            </button>
            {canView("sticky-notes") && <button
              type="button"
              className={`sidebar-link ${activeArea === "sticky-notes" && !isBoardOpen ? "active" : ""}`}
              onClick={() => onNavigateArea("sticky-notes")}
              aria-current={activeArea === "sticky-notes" && !isBoardOpen ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faNoteSticky} />
              <span>Sticky notes</span>
            </button>}
            {canView("profile") && <button
              type="button"
              className={`sidebar-link ${activeArea === "profile" && !isBoardOpen ? "active" : ""}`}
              onClick={() => onNavigateArea("profile")}
              aria-current={activeArea === "profile" ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faCircleUser} />
              <span>My profile</span>
            </button>}
          </section>
        )}

        {(canView("training") || canView("calendar") || canView("whiteboard")) && (
          <section className="workspace-nav-group" aria-label="Learning and development">
            <h2 className="workspace-nav-group-title">Learning & development</h2>
            {canView("training") && <button
              type="button"
              className={`sidebar-link ${activeArea === "training" && !isBoardOpen ? "active" : ""}`}
              onClick={() => onNavigateArea("training")}
              aria-current={activeArea === "training" ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faBookOpen} />
              <span>Learning paths</span>
            </button>}
            {canView("calendar") && <button
              type="button"
              className={`sidebar-link ${activeArea === "calendar" && !isBoardOpen ? "active" : ""}`}
              onClick={() => onNavigateArea("calendar")}
              aria-current={activeArea === "calendar" ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faCalendarDays} />
              <span>Calendar</span>
            </button>}
            {canView("whiteboard") && <button
              type="button"
              className={`sidebar-link ${isBoardOpen ? "active" : ""}`}
              onClick={onOpenBoard}
              aria-current={isBoardOpen ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faChalkboard} />
              <span>Whiteboard</span>
            </button>}
          </section>
        )}

      </nav>

      {canView("employee") && (
        <>
          <div
            className={`sidebar-section-heading ${isRootDropTarget ? "is-drop-target" : ""}`}
            onDragOver={onRootDragOver}
            onDragLeave={onRootDragLeave}
            onDrop={onDropRoot}
            title="Drop a subfolder here to move it to the top level"
          >
            <span>YOUR FOLDERS</span>
            <button
            type="button"
            className="icon-button folder-add-button"
            aria-label="Create folder"
            title="Create folder"
            onClick={onToggleRootFolderForm}
            >
              <FontAwesomeIcon icon={faFolderPlus} />
            </button>
          </div>
          {isRootFolderFormOpen && (
            <NewFolderForm
            isSubfolder={false}
            name={newFolderName}
            onNameChange={onNewFolderNameChange}
            onSubmit={onCreateFolder}
            onCancel={onCancelFolderForm}
            />
          )}
          <nav className="folder-navigation" aria-label="Document folders">
            <FolderTree
              folders={folders}
              items={items}
              folderCounts={folderCounts}
              selectedFolderId={selectedFolderId}
              selectedItemId={selectedItemId}
              isAddingFolder={isAddingFolder}
              newFolderParentId={newFolderParentId}
              newFolderName={newFolderName}
              dropTargetFolderId={dropTargetFolderId}
              dropPosition={dropPosition}
              onSelectFolder={onSelectFolder}
              onSelectItem={onSelectItem}
              onCreateFolder={onCreateFolder}
              onNewFolderNameChange={onNewFolderNameChange}
              onCancelFolderForm={onCancelFolderForm}
              onStartSubfolder={onStartSubfolder}
              onDeleteFolder={onDeleteFolder}
              onFolderDragOver={onFolderDragOver}
              onFolderDragLeave={onFolderDragLeave}
              onDropFolder={onDropFolder}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          </nav>
        </>
      )}

    </aside>
  );
}

export default WorkspaceSidebar;
