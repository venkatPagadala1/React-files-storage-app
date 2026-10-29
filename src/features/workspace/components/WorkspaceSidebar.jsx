import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faChalkboard,
  faFileLines,
  faFolder,
  faFolderPlus,
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

  return (
    <aside className={`workspace-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="workspace-brand">
        <div className="workspace-brand-mark">
          <VsrLogoMark />
        </div>
        <div>
          <strong className="workspace-brand-name">
            <VsrWordmark className="workspace-brand-wordmark" />
            <span>Workspace</span>
          </strong>
          <span>Personal knowledge hub</span>
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

      <button
        type="button"
        className={`sidebar-link ${selectedFolderId === "all" && !isBoardOpen ? "active" : ""}`}
        onClick={() => onSelectFolder("all")}
      >
        <FontAwesomeIcon icon={faFileLines} />
        <span>All documents</span>
        <span className="sidebar-count">{items.length}</span>
      </button>
      <button
        type="button"
        className={`sidebar-link ${isBoardOpen ? "active" : ""}`}
        onClick={onOpenBoard}
        aria-current={isBoardOpen ? "page" : undefined}
      >
        <FontAwesomeIcon icon={faChalkboard} />
        <span>Whiteboard</span>
        <span className="sidebar-count">New</span>
      </button>

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

      <div className="sidebar-storage-note">
        <span className="storage-status-dot storage-status-warning" />
        <div>
          <strong>Stored on this device</strong>
          <span>Local, unencrypted storage</span>
        </div>
      </div>
    </aside>
  );
}

export default WorkspaceSidebar;
