import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faEye,
  faFileLines,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../../lib/workspaceUtils.js";

function DocumentList({
  visibleItems,
  folders,
  selectedItemId,
  searchQuery,
  onSelectItem,
  onDeleteItem,
  onDragStart,
  onDragEnd,
}) {
  return (
    <section
      className="documents-panel flex min-w-0 min-h-[540px] flex-col overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--workspace-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-card)] max-[820px]:min-h-[360px]"
      aria-label="Documents"
    >
      <div className="documents-panel-heading flex min-h-[74px] items-center justify-between border-b border-[var(--workspace-border)] px-5">
        <div className="flex items-baseline gap-[9px]">
          <h2 className="m-0 text-[0.98rem] font-[720] text-[var(--workspace-ink)]">{searchQuery ? "Results" : "Recent documents"}</h2>
          <span className="text-[0.8rem] text-[var(--workspace-muted)]">{visibleItems.length} items</span>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty-documents flex min-h-[340px] flex-col items-center justify-center px-7 py-7 text-center text-[#858c9b]">
          <div className="empty-documents-icon grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[var(--workspace-accent-soft)] text-[1.15rem] text-[var(--workspace-accent)]">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <h3 className="mb-[6px] mt-[15px] text-[1.05rem] text-[var(--workspace-ink)]">{searchQuery ? "No matches found" : "Nothing here yet"}</h3>
          <p className="m-0 max-w-[290px] text-[0.88rem] leading-[1.55] text-[var(--workspace-muted)]">
            {searchQuery
              ? "Try a different search term."
              : "Create a note or upload a file to get started."}
          </p>
        </div>
      ) : (
        <div className="document-list grid max-h-[min(65vh,480px)] overflow-y-auto overscroll-contain [scrollbar-color:var(--workspace-accent)_var(--workspace-accent-soft)] [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {visibleItems.map((item) => {
            const folder = folders.find(
              (candidate) => candidate.id === item.folderId,
            );
            return (
              <div className="document-entry flex min-w-0 items-center border-b border-[var(--workspace-border)]" key={item.id}>
                <button
                  type="button"
                  className={`document-row relative z-0 flex min-h-[76px] min-w-0 w-full flex-1 items-center gap-[11px] border-0 bg-transparent px-4 py-[10px] text-left transition-colors duration-[120ms] focus-visible:relative focus-visible:z-[1] focus-visible:outline-offset-[-3px]${selectedItemId === item.id ? " selected" : ""}`}
                  onClick={() => onSelectItem(item)}
                  draggable
                  onDragStart={(event) =>
                    onDragStart(event, { type: "item", id: item.id })
                  }
                  onDragEnd={onDragEnd}
                  title={`Drag ${item.title} onto a folder to move it`}
                  aria-pressed={selectedItemId === item.id}
                >
                  <span
                    className={`document-type-icon grid h-[34px] w-[34px] flex-[0_0_34px] place-items-center rounded-[10px] bg-[var(--workspace-accent-soft)] text-[0.82rem] text-[var(--workspace-accent)]${item.kind === "file" ? " file" : ""}`}
                    style={
                      item.kind === "file" && folder
                        ? { color: folder.color }
                        : undefined
                    }
                  >
                    <FontAwesomeIcon
                      icon={item.kind === "file" ? faArrowUpFromBracket : faFileLines}
                    />
                  </span>
                  <span className="document-row-copy grid min-w-0 flex-1 gap-[5px]">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.88rem] font-[680] text-[var(--workspace-ink)]">{item.title}</strong>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] text-[var(--workspace-muted)]">
                      {folder?.name ?? "Unfiled"} · {formatDate(item.updatedAt)}
                    </span>
                  </span>
                  <span className={`document-kind-label rounded-[5px] px-[6px] py-1 text-[0.67rem] font-[780] tracking-[0.06em]${item.kind === "file" ? " file" : ""}`}>
                    {item.kind === "file" ? "FILE" : "NOTE"}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-button document-open-button"
                  aria-label={`Open ${item.kind}: ${item.title}`}
                  title={`Open ${item.title}`}
                  onClick={() => onSelectItem(item)}
                >
                  <FontAwesomeIcon icon={faEye} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-button document-delete-button"
                  aria-label={`Delete ${item.kind} ${item.title}`}
                  title={`Delete ${item.title}`}
                  onClick={() => onDeleteItem(item)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DocumentList;
