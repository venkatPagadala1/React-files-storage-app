import { createPortal } from "react-dom";
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
      <mark className="file-search-hit rounded-sm bg-[#ffdb70] text-[#372b0a]" key={index}>{part}</mark>
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
  onReplaceMissingFile,
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
  const previewFrameClass =
    "file-preview-frame my-0 max-h-[260px] min-h-40 w-full overflow-hidden rounded-none border-0 bg-[radial-gradient(ellipse_at_85%_0%,var(--workspace-accent-soft),transparent_58%),#f7f8fb]";

  const fileDetails = (
    <div className={`file-details flex min-h-[450px] flex-col items-start${isFileViewerOpen ? " is-fullscreen" : ""}`}>
      <div className="editor-topline mb-[23px] flex w-full items-center justify-between">
        <span className="editor-type inline-flex items-center gap-2 text-[0.62rem] font-extrabold tracking-[0.12em] text-[#828999] [&>svg]:text-[var(--workspace-accent)]">
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
          className={`file-viewer-stage file-edit-panel mb-4 mt-1 w-full min-w-0 overflow-hidden rounded-[14px] border border-[color-mix(in_srgb,var(--workspace-accent)_20%,#dfe3ed)] bg-[#f3f5f9] ${isFileViewerOpen ? "expanded" : ""}`}
          aria-label={`Edit file: ${item.title}`}
        >
          <div className="file-viewer-toolbar file-edit-toolbar flex min-h-12 flex-wrap items-center justify-between gap-[10px] border-b border-[#e3e6ee] bg-white px-[9px] py-[6px]">
            <span className="file-editing-title min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] font-semibold text-[#596276]">Editing {item.title}</span>
            <div className="file-viewer-tools flex min-w-0 items-center gap-[7px]">
              <button
                type="button"
                className="file-viewer-reset inline-flex min-h-[30px] items-center justify-center gap-[6px] whitespace-nowrap rounded-lg border border-[#e3e6ee] bg-white px-[9px] font-[inherit] text-[0.68rem] font-semibold text-[#596276] hover:border-[#cbd9f4] hover:bg-[#f4f7ff] hover:text-[#3974de]"
                onClick={onCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="save-note-button inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border-0 bg-[linear-gradient(110deg,color-mix(in_srgb,var(--workspace-accent)_78%,white),var(--workspace-accent))] px-3 text-[0.72rem] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onSaveEdit}
                disabled={!isDraftDirty}
              >
                Save changes
              </button>
              <button
                type="button"
                className="file-viewer-expand inline-flex min-h-[30px] items-center justify-center gap-[6px] whitespace-nowrap rounded-lg border border-[#e3e6ee] bg-white px-[9px] font-[inherit] text-[0.68rem] font-semibold text-[#596276] hover:border-[#cbd9f4] hover:bg-[#f4f7ff] hover:text-[#3974de]"
                onClick={onToggleFullView}
                aria-label={isFileViewerOpen ? "Close full view" : "Open full view"}
                title={isFileViewerOpen ? "Close full view (Esc)" : "Open full view"}
              >
                <FontAwesomeIcon icon={isFileViewerOpen ? faCompress : faExpand} />
                <span>{isFullViewLabel}</span>
              </button>
            </div>
          </div>
          <div className="file-viewer-content file-edit-content box-border flex min-h-[280px] w-full flex-col overflow-auto p-3">
            <textarea
              id="uploaded-file-content"
              className="file-content-editor box-border min-h-[220px] w-full flex-1 resize-y rounded-[10px] border border-[color-mix(in_srgb,var(--workspace-accent)_24%,#dfe3ed)] bg-white p-3 font-mono text-[0.78rem] leading-[1.6] text-[#343c4e]"
              aria-label="File contents"
              value={fileDraftContent}
              onChange={(event) => onFileContentChange(event.target.value)}
              onKeyDown={onFileEditorKeyDown}
              spellCheck={false}
            />
            <div className="file-editor-meta mt-[7px] flex flex-wrap justify-between gap-x-3 gap-y-[6px] text-[0.65rem] text-[var(--workspace-muted)]">
              <span>{fileDraftContent.length.toLocaleString()} characters</span>
              <span>{fileDraftContent.split(/\r?\n/).length.toLocaleString()} lines</span>
              <span>Ctrl/⌘ + S to save</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`file-viewer-stage mb-4 mt-1 w-full min-w-0 overflow-hidden rounded-[14px] border border-[color-mix(in_srgb,var(--workspace-accent)_20%,#dfe3ed)] bg-[#f3f5f9] ${isFileViewerOpen ? "expanded" : ""}`}
          aria-label={`File viewer: ${item.title}`}
        >
          <div className="file-viewer-toolbar flex min-h-12 flex-wrap items-center justify-start gap-[10px] border-b border-[#e3e6ee] bg-white px-[9px] py-[6px]">
            <div className="file-viewer-tools flex min-w-0 flex-1 items-center gap-[7px]">
              {["text", "docx"].includes(previewType) && (
                <label className="file-viewer-search flex h-8 min-w-0 flex-1 basis-[140px] items-center gap-[7px] rounded-lg border border-[#e3e6ee] px-2 text-[#788093]">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                  <input className="min-w-[80px] flex-1 border-0 bg-transparent text-[0.72rem] text-[#30384a] outline-none placeholder:text-[#9aa1af]"
                    type="search"
                    value={previewSearch}
                    onChange={(event) => onPreviewSearchChange(event.target.value)}
                    placeholder="Find in document"
                    aria-label="Find in document"
                  />
                  {previewSearch && (
                    <span className="file-search-count whitespace-nowrap text-[0.66rem] text-[#788093]">{searchMatchCount} found</span>
                  )}
                </label>
              )}
              {["text", "docx", "image"].includes(previewType) && (
                <div className="file-zoom-controls flex min-w-0 items-center gap-[7px] [&>span]:whitespace-nowrap [&>span]:text-[0.66rem] [&>span]:text-[#788093]" aria-label="Preview zoom">
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
            <div className="file-viewer-tools ml-auto flex min-w-0 flex-wrap items-center justify-end gap-[7px]">
              <button
                type="button"
                className="file-viewer-reset inline-flex min-h-[30px] items-center justify-center gap-[6px] whitespace-nowrap rounded-lg border border-[#e3e6ee] bg-white px-[9px] font-[inherit] text-[0.68rem] font-semibold text-[#596276] hover:border-[#cbd9f4] hover:bg-[#f4f7ff] hover:text-[#3974de]"
                onClick={onEdit}
                disabled={
                  item.hasFile === false ||
                  (previewType === "text" && isLoadingFileDocument)
                }
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
                  className="file-viewer-reset inline-flex min-h-[30px] items-center justify-center gap-[6px] whitespace-nowrap rounded-lg border border-[#e3e6ee] bg-white px-[9px] font-[inherit] text-[0.68rem] font-semibold text-[#596276] hover:border-[#cbd9f4] hover:bg-[#f4f7ff] hover:text-[#3974de]"
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
                  className="file-viewer-reset inline-flex min-h-[30px] items-center justify-center gap-[6px] whitespace-nowrap rounded-lg border border-[#e3e6ee] bg-white px-[9px] font-[inherit] text-[0.68rem] font-semibold text-[#596276] hover:border-[#cbd9f4] hover:bg-[#f4f7ff] hover:text-[#3974de]"
                  onClick={onResetZoom}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                className="file-viewer-expand inline-flex min-h-[30px] items-center justify-center gap-[6px] whitespace-nowrap rounded-lg border border-[#e3e6ee] bg-white px-[9px] font-[inherit] text-[0.68rem] font-semibold text-[#596276] hover:border-[#cbd9f4] hover:bg-[#f4f7ff] hover:text-[#3974de]"
                onClick={onToggleFullView}
                aria-label={isFileViewerOpen ? "Close full view" : "Open full view"}
                title={isFileViewerOpen ? "Close full view (Esc)" : "Open full view"}
              >
                <FontAwesomeIcon icon={isFileViewerOpen ? faCompress : faExpand} />
                <span>{isFullViewLabel}</span>
              </button>
            </div>
          </div>
          {item.hasFile !== false && previewType !== "text" && (
            <div className="file-viewer-edit-status border-b border-[color-mix(in_srgb,var(--workspace-accent)_18%,#e3e6ee)] bg-[color-mix(in_srgb,var(--workspace-accent-soft)_64%,white)] px-3 py-2 text-[0.68rem] leading-[1.5] text-[#687185]" role="note">
              {isExternalEditActive
                ? "Edit the downloaded copy in a compatible app, then choose Save edited copy to update this item in place."
                : "Choose Edit to download this file for editing in a compatible app. After editing, save the copy back to this same workspace item."}
            </div>
          )}
          <div className="file-viewer-content min-h-40 w-full overflow-auto">
            {item.hasFile === false ? (
              <div className="file-preview-unavailable my-2 mb-[14px] rounded-[10px] border border-[color-mix(in_srgb,var(--workspace-accent)_17%,#dfe3ed)] bg-[var(--workspace-accent-soft)] px-3 py-[11px] text-[0.72rem] leading-[1.55] text-[var(--workspace-muted)]" role="alert">
                <p>
                  This file is listed in your workspace, but its contents are missing
                  from storage. Choose the original file to upload it again.
                </p>
                <button
                  type="button"
                  className="save-note-button inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border-0 bg-[linear-gradient(110deg,color-mix(in_srgb,var(--workspace-accent)_78%,white),var(--workspace-accent))] px-3 text-[0.72rem] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onReplaceMissingFile}
                >
                  <FontAwesomeIcon icon={faArrowUpFromBracket} />
                  <span>Replace missing file</span>
                </button>
              </div>
            ) : previewType === "unsupported" ? (
              <div className="file-preview-unavailable my-2 mb-[14px] rounded-[10px] border border-[color-mix(in_srgb,var(--workspace-accent)_17%,#dfe3ed)] bg-[var(--workspace-accent-soft)] px-3 py-[11px] text-[0.72rem] leading-[1.55] text-[var(--workspace-muted)]">
                Preview is not available for this file type. Download it to open it
                with a compatible app.
              </div>
            ) : null}
            {previewUrl && previewType === "image" && (
              <div className={`${previewFrameClass} image-preview grid min-h-[120px] place-items-center p-2`}>
                <img
                  className="block max-h-[242px] max-w-full object-contain"
                  src={previewUrl}
                  alt={`Preview of ${item.title}`}
                  style={{ zoom: `${previewZoom}%` }}
                />
              </div>
            )}
            {previewUrl && previewType === "pdf" && (
              <div className={`${previewFrameClass} pdf-preview`}>
                <iframe className="block h-[260px] w-full border-0 bg-white" title={`Preview of ${item.title}`} src={previewUrl} />
              </div>
            )}
            {previewType === "text" && (
              <div className={`${previewFrameClass} text-preview`}>
                {isLoadingFileDocument ? (
                  <p className="file-document-loading m-0 p-[14px] text-[0.75rem] text-[var(--workspace-muted)]">Loading preview…</p>
                ) : (
                  <pre
                    className="file-text-content m-0 max-h-[220px] overflow-auto p-3 font-mono text-[0.75rem] leading-[1.6] text-[#343c4e] [overflow-wrap:anywhere] whitespace-pre-wrap"
                    style={{ zoom: `${previewZoom}%` }}
                  >
                    {highlightText(fileDocumentText, previewSearch)}
                  </pre>
                )}
              </div>
            )}
            {previewType === "docx" && (
              <div className={`${previewFrameClass} docx-preview-frame max-h-[65vh] min-h-[420px] overflow-auto bg-[#e7e9ef] p-3`}>
                {isRenderingDocx && (
                  <p className="file-document-loading m-0 p-[14px] text-[0.75rem] text-[var(--workspace-muted)]">Opening full Word document…</p>
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
              <div className={`${previewFrameClass} media-preview`}>
                <video className="block h-[260px] w-full border-0 bg-[#080b12] object-contain" controls src={previewUrl}>
                  Video preview is not supported by this browser.
                </video>
              </div>
            )}
            {previewUrl && previewType === "audio" && (
              <div className={`${previewFrameClass} audio-preview grid min-h-[110px] place-items-center p-5`}>
                <audio className="w-full" controls src={previewUrl}>
                  Audio preview is not supported by this browser.
                </audio>
              </div>
            )}
          </div>
        </div>
      )}
      <h2 className="m-0 max-w-full break-words text-base text-[#30384a]">{item.title}</h2>
      <p className="mt-[7px] mb-0 text-[0.72rem] text-[#858c9b]">{folderName ?? "Unfiled"} · {formatDate(item.createdAt)}</p>
      <span className="mt-[14px] rounded-md bg-[#f2f3f8] px-2 py-[5px] text-[0.72rem] text-[#858c9b]">
        {item.size < 1024 * 1024
          ? `${Math.max(1, Math.round(item.size / 1024))} KB`
          : `${(item.size / (1024 * 1024)).toFixed(1)} MB`}
      </span>
      {!isEditing && item.hasFile !== false && (
        <button
          type="button"
          className="save-note-button download-file-button mt-[22px] inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border-0 bg-[linear-gradient(110deg,color-mix(in_srgb,var(--workspace-accent)_78%,white),var(--workspace-accent))] px-3 text-[0.72rem] font-bold text-white"
          onClick={onDownload}
        >
          <FontAwesomeIcon icon={faArrowDown} />
          Download file
        </button>
      )}
    </div>
  );

  return isFileViewerOpen
    ? createPortal(fileDetails, document.body)
    : fileDetails;
}

export default FileDetails;
