import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUpFromBracket,
  faCompress,
  faExpand,
  faFileLines,
  faMagnifyingGlass,
  faMinus,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { escapeRegExp, formatDate } from "../../../lib/workspaceUtils.js";

function highlightText(text, query) {
  const search = query.trim();
  if (!search) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(search)})`, "gi"));
  return parts.map((part, index) =>
    part.toLocaleLowerCase() === search.toLocaleLowerCase() ? (
      <mark className="file-search-hit" key={index}>{part}</mark>
    ) : (
      part
    ),
  );
}

function FileDetails({
  item,
  folderName,
  previewType,
  previewUrl,
  previewSearch,
  searchMatchCount,
  previewZoom,
  isEditing,
  isExternalEditActive,
  isDraftDirty,
  fileDraftContent,
  fileDocumentText,
  isLoadingFileDocument,
  isRenderingDocx,
  isFileViewerOpen,
  docxPreviewRef,
  onDelete,
  onEdit,
  onSaveEditedCopy,
  onPreviewSearchChange,
  onZoomChange,
  onResetZoom,
  onToggleFullView,
  onCancelEdit,
  onSaveEdit,
  onFileContentChange,
  onFileEditorKeyDown,
  onDownload,
}) {
  const isFullViewLabel = isFileViewerOpen ? "Close" : "Full view";

  return (
    <div className="file-details">
      <div className="editor-topline">
        <span className="editor-type">
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
          UPLOADED FILE
        </span>
        <button
          type="button"
          className="icon-button danger-icon-button"
          onClick={onDelete}
          aria-label="Delete file"
          title="Delete file"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
      {isEditing ? (
        <div
          className={`file-viewer-stage file-edit-panel ${isFileViewerOpen ? "expanded" : ""}`}
          aria-label={`Edit file: ${item.title}`}
        >
          <div className="file-viewer-toolbar file-edit-toolbar">
            <span className="file-editing-title">Editing {item.title}</span>
            <div className="file-viewer-tools">
              <button
                type="button"
                className="file-viewer-reset"
                onClick={onCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="save-note-button"
                onClick={onSaveEdit}
                disabled={!isDraftDirty}
              >
                Save changes
              </button>
              <button
                type="button"
                className="file-viewer-expand"
                onClick={onToggleFullView}
                aria-label={isFileViewerOpen ? "Close full view" : "Open full view"}
                title={isFileViewerOpen ? "Close full view (Esc)" : "Open full view"}
              >
                <FontAwesomeIcon icon={isFileViewerOpen ? faCompress : faExpand} />
                <span>{isFullViewLabel}</span>
              </button>
            </div>
          </div>
          <div className="file-viewer-content file-edit-content">
            <textarea
              id="uploaded-file-content"
              className="file-content-editor"
              aria-label="File contents"
              value={fileDraftContent}
              onChange={(event) => onFileContentChange(event.target.value)}
              onKeyDown={onFileEditorKeyDown}
              spellCheck={false}
            />
            <div className="file-editor-meta">
              <span>{fileDraftContent.length.toLocaleString()} characters</span>
              <span>{fileDraftContent.split(/\r?\n/).length.toLocaleString()} lines</span>
              <span>Ctrl/⌘ + S to save</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`file-viewer-stage ${isFileViewerOpen ? "expanded" : ""}`}
          aria-label={`File viewer: ${item.title}`}
        >
          <div className="file-viewer-toolbar">
            <div className="file-viewer-tools">
              {["text", "docx"].includes(previewType) && (
                <label className="file-viewer-search">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                  <input
                    type="search"
                    value={previewSearch}
                    onChange={(event) => onPreviewSearchChange(event.target.value)}
                    placeholder="Find in document"
                    aria-label="Find in document"
                  />
                  {previewSearch && (
                    <span className="file-search-count">{searchMatchCount} found</span>
                  )}
                </label>
              )}
              {["text", "docx", "image"].includes(previewType) && (
                <div className="file-zoom-controls" aria-label="Preview zoom">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onZoomChange(Math.max(50, previewZoom - 10))}
                    disabled={previewZoom <= 50}
                    aria-label="Zoom out"
                    title="Zoom out"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span>{previewZoom}%</span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onZoomChange(Math.min(150, previewZoom + 10))}
                    disabled={previewZoom >= 150}
                    aria-label="Zoom in"
                    title="Zoom in"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              )}
            </div>
            <div className="file-viewer-tools">
              <button
                type="button"
                className="file-viewer-reset"
                onClick={onEdit}
                disabled={previewType === "text" && isLoadingFileDocument}
                title={
                  previewType === "text"
                    ? "Edit this text file in the workspace"
                    : "Download a copy to edit in a compatible app"
                }
              >
                <FontAwesomeIcon icon={faFileLines} />
                <span>Edit</span>
              </button>
              {isExternalEditActive && (
                <button
                  type="button"
                  className="file-viewer-reset"
                  onClick={onSaveEditedCopy}
                  title="Save your edited copy over this workspace item"
                >
                  <FontAwesomeIcon icon={faArrowUpFromBracket} />
                  <span>Save edited copy</span>
                </button>
              )}
              {previewZoom !== 100 && (
                <button
                  type="button"
                  className="file-viewer-reset"
                  onClick={onResetZoom}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                className="file-viewer-expand"
                onClick={onToggleFullView}
                aria-label={isFileViewerOpen ? "Close full view" : "Open full view"}
                title={isFileViewerOpen ? "Close full view (Esc)" : "Open full view"}
              >
                <FontAwesomeIcon icon={isFileViewerOpen ? faCompress : faExpand} />
                <span>{isFullViewLabel}</span>
              </button>
            </div>
          </div>
          {previewType !== "text" && (
            <div className="file-viewer-edit-status" role="note">
              {isExternalEditActive
                ? "Edit the downloaded copy in a compatible app, then choose Save edited copy to update this item in place."
                : "Choose Edit to download this file for editing in a compatible app. After editing, save the copy back to this same workspace item."}
            </div>
          )}
          <div className="file-viewer-content">
            {previewType === "unsupported" && (
              <div className="file-preview-unavailable">
                Preview is not available for this file type. Download it to open it
                with a compatible app.
              </div>
            )}
            {previewUrl && previewType === "image" && (
              <div className="file-preview-frame image-preview">
                <img
                  src={previewUrl}
                  alt={`Preview of ${item.title}`}
                  style={{ zoom: `${previewZoom}%` }}
                />
              </div>
            )}
            {previewUrl && previewType === "pdf" && (
              <div className="file-preview-frame pdf-preview">
                <iframe title={`Preview of ${item.title}`} src={previewUrl} />
              </div>
            )}
            {previewType === "text" && (
              <div className="file-preview-frame text-preview">
                {isLoadingFileDocument ? (
                  <p className="file-document-loading">Loading preview…</p>
                ) : (
                  <pre
                    className="file-text-content"
                    style={{ zoom: `${previewZoom}%` }}
                  >
                    {highlightText(fileDocumentText, previewSearch)}
                  </pre>
                )}
              </div>
            )}
            {previewType === "docx" && (
              <div className="file-preview-frame docx-preview-frame">
                {isRenderingDocx && (
                  <p className="file-document-loading">Opening full Word document…</p>
                )}
                <div
                  className="docx-full-preview"
                  ref={docxPreviewRef}
                  aria-label={`Full preview of ${item.title}`}
                  style={{ zoom: `${previewZoom}%` }}
                />
              </div>
            )}
            {previewUrl && previewType === "video" && (
              <div className="file-preview-frame media-preview">
                <video controls src={previewUrl}>
                  Video preview is not supported by this browser.
                </video>
              </div>
            )}
            {previewUrl && previewType === "audio" && (
              <div className="file-preview-frame audio-preview">
                <audio controls src={previewUrl}>
                  Audio preview is not supported by this browser.
                </audio>
              </div>
            )}
          </div>
        </div>
      )}
      <h2>{item.title}</h2>
      <p>{folderName ?? "Unfiled"} · {formatDate(item.createdAt)}</p>
      <span className="file-size">
        {item.size < 1024 * 1024
          ? `${Math.max(1, Math.round(item.size / 1024))} KB`
          : `${(item.size / (1024 * 1024)).toFixed(1)} MB`}
      </span>
      {!isEditing && (
        <button
          type="button"
          className="save-note-button download-file-button"
          onClick={onDownload}
        >
          <FontAwesomeIcon icon={faArrowDown} />
          Download file
        </button>
      )}
    </div>
  );
}

export default FileDetails;
