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
    <section className="documents-panel" aria-label="Documents">
      <div className="documents-panel-heading">
        <div>
          <h2>{searchQuery ? "Results" : "Recent documents"}</h2>
          <span>{visibleItems.length} items</span>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty-documents">
          <div className="empty-documents-icon">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <h3>{searchQuery ? "No matches found" : "Nothing here yet"}</h3>
          <p>
            {searchQuery
              ? "Try a different search term."
              : "Create a note or upload a file to get started."}
          </p>
        </div>
      ) : (
        <div className="document-list">
          {visibleItems.map((item) => {
            const folder = folders.find(
              (candidate) => candidate.id === item.folderId,
            );
            return (
              <div className="document-entry" key={item.id}>
                <button
                  type="button"
                  className={`document-row ${selectedItemId === item.id ? "selected" : ""}`}
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
                    className={`document-type-icon ${item.kind}`}
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
                  <span className="document-row-copy">
                    <strong>{item.title}</strong>
                    <span>
                      {folder?.name ?? "Unfiled"} · {formatDate(item.updatedAt)}
                    </span>
                  </span>
                  <span className={`document-kind-label ${item.kind}`}>
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
