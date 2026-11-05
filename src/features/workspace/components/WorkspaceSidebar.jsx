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
    <form className="mb-2 flex gap-1.5" onSubmit={onSubmit}>
      <input
        autoFocus
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={isSubfolder ? "Subfolder name" : "Folder name"}
        aria-label={isSubfolder ? "New subfolder name" : "New folder name"}
        maxLength={40}
        className="h-[34px] w-full min-w-0 rounded-lg border border-gray-300 px-2.5 text-[0.75rem] font-[inherit] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
      />
      <button
        type="submit"
        aria-label="Save folder"
        className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-teal-600 text-white hover:bg-teal-700"
      >
        <FontAwesomeIcon icon={faFolderPlus} />
      </button>
      <button
        type="button"
        aria-label="Cancel folder creation"
        onClick={onCancel}
        className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
            className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${selectedFolderId === folder.id ? "bg-teal-50 text-teal-700 font-semibold shadow-sm" : ""}`}
            onClick={() => onSelectFolder(folder.id)}
            draggable
            onDragStart={(event) =>
              onDragStart(event, { type: "folder", id: folder.id })
            }
            onDragEnd={onDragEnd}
            title={`Drag ${folder.name} onto a sibling folder to reorder it`}
          >
            <FontAwesomeIcon className="w-4" icon={faFolder} style={{ color: folder.color }} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">{folder.name}</span>
            <span className="text-[.74rem] text-gray-400">{folderCounts[folder.id] ?? 0}</span>
          </button>
          <button
            type="button"
            className="inline-grid h-7 w-[26px] shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-gray-400 opacity-60 transition hover:bg-gray-100 hover:text-gray-700 hover:opacity-100"
            aria-label={`Create subfolder in ${folder.name}`}
            title={`Create subfolder in ${folder.name}`}
            onClick={() => onStartSubfolder(folder.id)}
          >
            <FontAwesomeIcon icon={faFolderPlus} />
          </button>
          <button
            type="button"
            className="inline-grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
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
                className={`flex min-h-[30px] w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1 text-left text-[0.7rem] text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 ${selectedItemId === item.id ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
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
                  className="w-3 shrink-0 text-teal-600"
                  icon={item.kind === "file" ? faArrowUpFromBracket : faFileLines}
                  aria-hidden="true"
                />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{item.title}</span>
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
    <aside className={`workspace-sidebar relative z-[4] box-border flex h-dvh min-h-0 flex-col overflow-hidden border-r border-[var(--workspace-border)] bg-[var(--ui-surface)] px-[14px] pt-[22px] pb-[18px] ${isOpen ? "is-open" : ""}`}>
      <div className="workspace-brand flex shrink-0 items-center gap-3 px-2 pt-1 pb-[22px]">
        <div className="workspace-brand-mark grid h-[42px] w-[42px] place-items-center rounded-[13px]">
          <VsrLogoMark />
        </div>
        <div className="grid min-w-0 gap-0.5">
          <strong className="workspace-brand-name text-[.88rem] font-[760] tracking-[-.02em]">
            <VsrWordmark className="workspace-brand-wordmark" />
            <span className="text-[.7rem]">GROUP</span>
          </strong>
          <span className="text-[.78rem]">VSR Group of Companies</span>
        </div>
        <button
          type="button"
          className="icon-button workspace-icon-button-migrated inline-grid h-[34px] w-[34px] flex-[0_0_34px] cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent p-0 text-[#8790a0] transition-[background,color] duration-[140ms] sidebar-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <nav className="workspace-area-navigation flex min-h-0 max-h-[min(44vh,470px)] flex-[0_1_auto] flex-col gap-3 overflow-y-auto overscroll-contain pr-px pt-[6px] pb-1 pl-[9px]" aria-label="Workspace areas">
        {canView("company") && (
          <section className="workspace-nav-group grid gap-1" aria-label="Company">
            <h2 className="workspace-nav-group-title m-0 mb-0.5 px-[10px] text-[.68rem] font-[750] leading-[1.4] tracking-[.09em] uppercase">Company</h2>
            <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${activeArea === "company" && !isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={() => onNavigateArea("company")}
              aria-current={activeArea === "company" ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faBuilding} />
              <span>Overview</span>
            </button>
          </section>
        )}

        {canView("employee") && (
          <section className="workspace-nav-group grid gap-1" aria-label="My workspace">
            <h2 className="workspace-nav-group-title m-0 mb-0.5 px-[10px] text-[.68rem] font-[750] leading-[1.4] tracking-[.09em] uppercase">My workspace</h2>
            <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${activeArea === "employee" && !isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={() => onSelectFolder("all")}
              aria-current={activeArea === "employee" && !isBoardOpen ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faFileLines} />
              <span>Documents</span>
              <span className="ml-auto text-[.74rem] text-gray-400 font-medium">{items.length}</span>
            </button>
            {canView("sticky-notes") && <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${activeArea === "sticky-notes" && !isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={() => onNavigateArea("sticky-notes")}
              aria-current={activeArea === "sticky-notes" && !isBoardOpen ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faNoteSticky} />
              <span>Sticky notes</span>
            </button>}
            {canView("profile") && <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${activeArea === "profile" && !isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={() => onNavigateArea("profile")}
              aria-current={activeArea === "profile" ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faCircleUser} />
              <span>My profile</span>
            </button>}
          </section>
        )}

        {(canView("training") || canView("calendar") || canView("whiteboard")) && (
          <section className="workspace-nav-group grid gap-1" aria-label="Learning and development">
            <h2 className="workspace-nav-group-title m-0 mb-0.5 px-[10px] text-[.68rem] font-[750] leading-[1.4] tracking-[.09em] uppercase">Learning & development</h2>
            {canView("training") && <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${activeArea === "training" && !isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={() => onNavigateArea("training")}
              aria-current={activeArea === "training" ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faBookOpen} />
              <span>Learning paths</span>
            </button>}
            {canView("calendar") && <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${activeArea === "calendar" && !isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={() => onNavigateArea("calendar")}
              aria-current={activeArea === "calendar" ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faCalendarDays} />
              <span>Calendar</span>
            </button>}
            {canView("whiteboard") && <button
              type="button"
              className={`flex min-h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[.86rem] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${isBoardOpen ? "bg-teal-50 text-teal-700 font-semibold" : ""}`}
              onClick={onOpenBoard}
              aria-current={isBoardOpen ? "page" : undefined}
            >
              <FontAwesomeIcon className="w-4" icon={faChalkboard} />
              <span>Whiteboard</span>
            </button>}
          </section>
        )}

      </nav>

      {canView("employee") && (
        <>
          <div
            className={`sidebar-section-heading mt-[18px] mr-1 mb-2 ml-[10px] flex shrink-0 items-center justify-between text-[.68rem] font-[750] tracking-[.12em] ${isRootDropTarget ? "is-drop-target" : ""}`}
            onDragOver={onRootDragOver}
            onDragLeave={onRootDragLeave}
            onDrop={onDropRoot}
            title="Drop a subfolder here to move it to the top level"
          >
            <span>YOUR FOLDERS</span>
            <button
            type="button"
            className="icon-button workspace-icon-button-migrated inline-grid h-7 w-7 flex-[0_0_28px] cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent p-0 text-[#8790a0] transition-[background,color] duration-[140ms] folder-add-button"
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
          <nav className="folder-navigation grid min-h-0 flex-1 content-start gap-[3px] overflow-y-auto overscroll-contain pb-1" aria-label="Document folders">
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
