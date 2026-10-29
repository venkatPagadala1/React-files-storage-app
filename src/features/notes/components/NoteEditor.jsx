import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getFolderPath } from "../../../lib/workspaceUtils.js";
import PreparationTracker from "./PreparationTracker.jsx";

function NoteEditor({
  activeItem,
  isCreatingNote,
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
      className={`note-editor${isPreparationTrackerFocused ? " is-preparation-focused" : ""}`}
      onSubmit={onSave}
    >
      <div className="editor-topline">
        <span className="editor-type">
          <FontAwesomeIcon icon={faFileLines} />
          {isCreatingNote ? "NEW NOTE" : "NOTE"}
        </span>
        <div className="note-editor-actions">
          {isPreparationTrackerFocused && (
            <button
              type="button"
              className="note-focus-return"
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

      <div className="preparation-note-meta">
        <div className="preparation-note-meta-field">
          <label className="editor-label" htmlFor="note-title">
            Board title
          </label>
          <input
            id="note-title"
            className="note-title-input"
            value={draftTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Give your note a title"
            maxLength={100}
            required
          />
        </div>
        <div className="preparation-note-meta-field">
          <label className="editor-label" htmlFor="note-folder">
            Save in
          </label>
          <select
            id="note-folder"
            className="note-folder-select"
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
        <details className="preparation-session-notes">
          <summary>Session notes <span>Optional context for this board</span></summary>
          <textarea
            id="note-content"
            className="note-content-input"
            value={draftContent}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Capture your ideas, preparation plan, or key takeaways…"
          />
        </details>
      ) : (
        <>
          <label className="editor-label" htmlFor="note-content">
            Overall interview notes
          </label>
          <textarea
            id="note-content"
            className="note-content-input"
            value={draftContent}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Capture your ideas, preparation plan, or key takeaways…"
          />
        </>
      )}

      <div className="editor-footer">
        <span>{isDraftDirty ? "Unsaved changes" : "Saved on this device"}</span>
        <button
          type="submit"
          className="save-note-button"
          disabled={!isDraftDirty}
        >
          Save note
        </button>
      </div>
    </form>
  );
}

export default NoteEditor;
