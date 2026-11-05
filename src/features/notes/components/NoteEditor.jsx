import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getFolderPath } from "../../../lib/workspaceUtils.js";
import PreparationTracker from "./PreparationTracker.jsx";

function NoteEditor({
  activeItem,
  isCreatingNote,
  isTrainingPreparation,
  isPreparationTrackerFocused,
  draftTitle,
  draftContent,
  draftFolderId,
  draftTopics,
  boardStrokes,
  draggedTopicId,
  topicDropTarget,
  isDraftDirty,
  folders,
  onSave,
  onDelete,
  onShowDocuments,
  onTitleChange,
  onFolderChange,
  onContentChange,
  onBoardStrokesChange,
  onAddTopic,
  onUpdateTopic,
  onRemoveTopic,
  onTogglePinned,
  onMoveTopic,
  onTopicDragStart,
  onTopicDragOver,
  onTopicDrop,
  onTopicDragEnd,
  onTopicDragLeave,
}) {
  return (
    <form
      className={`note-editor flex h-full flex-col${isPreparationTrackerFocused ? " is-preparation-focused min-h-0" : ""}`}
      onSubmit={onSave}
    >
      <div className={`editor-topline flex items-center justify-between ${isPreparationTrackerFocused ? "mb-3" : "mb-[23px]"}`}>
        <span className="editor-type inline-flex items-center gap-2 text-[0.62rem] font-extrabold tracking-[0.12em] text-[#828999] [&>svg]:text-[var(--workspace-accent)]">
          <FontAwesomeIcon icon={faFileLines} />
          {isCreatingNote ? "NEW NOTE" : "NOTE"}
        </span>
        <div className="note-editor-actions flex items-center gap-[9px]">
          {isPreparationTrackerFocused && (
            <button
              type="button"
              className="note-focus-return min-h-8 rounded-lg border border-[color-mix(in_srgb,var(--workspace-accent)_28%,#e1e4ec)] bg-[color-mix(in_srgb,var(--workspace-accent-soft)_64%,white)] px-[10px] text-[0.67rem] font-semibold text-[var(--workspace-accent)] hover:border-[var(--workspace-accent)] hover:bg-[color-mix(in_srgb,var(--workspace-accent-soft)_82%,white)]"
              onClick={onShowDocuments}
            >
              Show documents
            </button>
          )}
          {activeItem && (
            <button
              type="button"
              className="icon-button danger-icon-button"
              onClick={onDelete}
              aria-label="Delete note"
              title="Delete note"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>

      <div className={`preparation-note-meta ${isPreparationTrackerFocused ? "mb-[14px] grid grid-cols-[minmax(0,1fr)_minmax(170px,240px)] gap-[14px] max-[700px]:mb-[10px] max-[700px]:grid-cols-1 max-[700px]:gap-2" : ""}`}>
        <div className={`preparation-note-meta-field ${isPreparationTrackerFocused ? "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-[10px]" : ""}`}>
          <label className={`editor-label mb-[7px] text-[0.7rem] font-semibold text-[#545d6d] ${isPreparationTrackerFocused ? "m-0 whitespace-nowrap text-[0.63rem] text-[#8490a2]" : ""}`} htmlFor="note-title">
            Board title
          </label>
          <input
            id="note-title"
            className={`note-title-input mb-4 w-full box-border rounded-[9px] border border-[#e1e4ec] bg-white px-[11px] py-[10px] font-[inherit] text-[0.76rem] text-[#30384a] outline-none focus:border-[var(--workspace-accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--workspace-accent)_14%,transparent)] ${isPreparationTrackerFocused ? "mb-0 h-9 min-h-9 min-w-0 border-[#e8ecf2] bg-[#f8f9fb] px-[11px] py-0 text-[0.74rem]" : ""}`}
            value={draftTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Give your note a title"
            maxLength={100}
            required
          />
        </div>
        <div className={`preparation-note-meta-field ${isPreparationTrackerFocused ? "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-[10px]" : ""}`}>
          <label className={`editor-label mb-[7px] text-[0.7rem] font-semibold text-[#545d6d] ${isPreparationTrackerFocused ? "m-0 whitespace-nowrap text-[0.63rem] text-[#8490a2]" : ""}`} htmlFor="note-folder">
            Save in
          </label>
          <select
            id="note-folder"
            className={`note-folder-select mb-4 min-h-[39px] w-full box-border rounded-[9px] border border-[#e1e4ec] bg-white px-[11px] py-[10px] font-[inherit] text-[0.76rem] text-[#30384a] outline-none focus:border-[var(--workspace-accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--workspace-accent)_14%,transparent)] ${isPreparationTrackerFocused ? "mb-0 h-9 min-h-9 min-w-0 border-[#e8ecf2] bg-[#f8f9fb] px-[11px] py-0 text-[0.74rem]" : ""}`}
            value={draftFolderId}
            onChange={(event) => onFolderChange(event.target.value)}
            required
          >
            {folders.map((folder) => (
              <option value={folder.id} key={folder.id}>
                {getFolderPath(folder.id, folders)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PreparationTracker
        boardTitle={draftTitle}
        isTrainingPreparation={isTrainingPreparation}
        draftTopics={draftTopics}
        boardStrokes={boardStrokes}
        draggedTopicId={draggedTopicId}
        topicDropTarget={topicDropTarget}
        onAddTopic={onAddTopic}
        onUpdateTopic={onUpdateTopic}
        onBoardStrokesChange={onBoardStrokesChange}
        onRemoveTopic={onRemoveTopic}
        onTogglePinned={onTogglePinned}
        onMoveTopic={onMoveTopic}
        onTopicDragStart={onTopicDragStart}
        onTopicDragOver={onTopicDragOver}
        onTopicDrop={onTopicDrop}
        onTopicDragEnd={onTopicDragEnd}
        onTopicDragLeave={onTopicDragLeave}
      />

      {isPreparationTrackerFocused ? (
        <details className="preparation-session-notes mt-[9px] flex-none">
          <summary className="flex cursor-pointer list-none items-center gap-[9px] text-[0.68rem] font-semibold text-[#68758a] before:content-['+'] before:text-[0.9rem] before:text-[var(--workspace-accent)] open:before:content-['−']">Session notes <span className="text-[0.63rem] font-normal text-[#9aa3b0]">Optional context for this board</span></summary>
          <textarea
            id="note-content"
            className="note-content-input mt-[7px] min-h-16 max-h-[100px] w-full resize-y rounded-[9px] border border-[#e1e4ec] bg-[#fafbfd] px-[11px] py-[10px] font-[inherit] text-[0.76rem] leading-[1.65] text-[#30384a] outline-none focus:border-[var(--workspace-accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--workspace-accent)_14%,transparent)]"
            value={draftContent}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Capture your ideas, preparation plan, or key takeaways…"
          />
        </details>
      ) : (
        <>
          <label className="editor-label mb-[7px] text-[0.7rem] font-semibold text-[#545d6d]" htmlFor="note-content">
            Overall interview notes
          </label>
          <textarea
            id="note-content"
            className="note-content-input mb-4 min-h-[190px] w-full flex-1 resize-y rounded-[9px] border border-[#e1e4ec] bg-white px-[11px] py-[10px] font-[inherit] text-[0.76rem] leading-[1.65] text-[#30384a] outline-none focus:border-[var(--workspace-accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--workspace-accent)_14%,transparent)]"
            value={draftContent}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Capture your ideas, preparation plan, or key takeaways…"
          />
        </>
      )}

      <div className={`editor-footer flex items-center justify-between gap-[10px] text-[0.67rem] text-[#9399a7] ${isPreparationTrackerFocused ? "mt-2 flex-none" : ""}`}>
        <span>{isDraftDirty ? "Unsaved changes" : "Saved on this device"}</span>
        <button
          type="submit"
          className="save-note-button inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border-0 bg-[linear-gradient(110deg,color-mix(in_srgb,var(--workspace-accent)_78%,white),var(--workspace-accent))] px-3 text-[0.72rem] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isDraftDirty}
        >
          Save note
        </button>
      </div>
    </form>
  );
}

export default NoteEditor;
