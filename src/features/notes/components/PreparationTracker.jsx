import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faChalkboard,
  faCircleDot,
  faEraser,
  faList,
  faPen,
  faPlus,
  faRotateLeft,
  faThumbtack,
  faXmark,
  faGripVertical,
} from "@fortawesome/free-solid-svg-icons";
import { createId } from "../../../lib/workspaceUtils.js";

function PreparationTracker({
  boardTitle,
  draftTopics,
  boardStrokes,
  draggedTopicId,
  topicDropTarget,
  onAddTopic,
  onUpdateTopic,
  onBoardStrokesChange,
  onRemoveTopic,
  onTogglePinned,
  onMoveTopic,
  onTopicDragStart,
  onTopicDragOver,
  onTopicDrop,
  onTopicDragEnd,
  onTopicDragLeave,
}) {
  const [view, setView] = useState("board");
  const [inkTool, setInkTool] = useState("pen");
  const [inkColor, setInkColor] = useState("#fff1a1");
  const [inkWidth, setInkWidth] = useState(3);
  const [draftStroke, setDraftStroke] = useState(null);
  const draftStrokeRef = useRef(null);
  const boardCanvasRef = useRef(null);
  const namedTopics = draftTopics.filter((topic) => topic.title.trim());
  const completedCount = namedTopics.filter(
    (topic) => topic.status === "done",
  ).length;
  const inProgressCount = namedTopics.filter(
    (topic) => topic.status === "in-progress",
  ).length;
  const progress = namedTopics.length
    ? Math.round((completedCount / namedTopics.length) * 100)
    : 0;
  const inkColors = [
    { value: "#fff1a1", label: "Yellow ink" },
    { value: "#f8fafc", label: "White ink" },
    { value: "#ff914d", label: "Orange ink" },
    { value: "#7fc8ff", label: "Blue ink" },
    { value: "#9ce5b5", label: "Green ink" },
  ];

  function getBoardPoint(event) {
    const bounds = boardCanvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * 1600 / bounds.width,
      y: (event.clientY - bounds.top) * 1000 / bounds.height,
    };
  }

  function removeStrokeAt(point) {
    const tolerance = 20;
    onBoardStrokesChange((strokes) =>
      strokes.filter(
        (stroke) =>
          !stroke.points?.some(
            (sample) =>
              Math.hypot(sample.x - point.x, sample.y - point.y) <
              tolerance + (stroke.width ?? 0),
          ),
      ),
    );
  }

  function handleBoardPointerDown(event) {
    if (event.button !== 0 || inkTool === "select") return;
    if (event.target.closest("input, textarea, select, button, summary")) return;
    const point = getBoardPoint(event);
    if (inkTool === "eraser") {
      removeStrokeAt(point);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const stroke = {
      id: createId(),
      color: inkColor,
      width: inkWidth,
      points: [point],
      path: `M ${point.x} ${point.y}`,
    };
    draftStrokeRef.current = stroke;
    setDraftStroke(stroke);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBoardPointerMove(event) {
    if (inkTool === "eraser" && event.buttons === 1) {
      removeStrokeAt(getBoardPoint(event));
      return;
    }
    const currentStroke = draftStrokeRef.current;
    if (!currentStroke) return;
    const point = getBoardPoint(event);
    const nextStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point],
      path: `${currentStroke.path} L ${point.x} ${point.y}`,
    };
    draftStrokeRef.current = nextStroke;
    setDraftStroke(nextStroke);
  }

  function finishBoardStroke() {
    const finishedStroke = draftStrokeRef.current;
    if (finishedStroke) {
      onBoardStrokesChange((strokes) => [...strokes, finishedStroke]);
    }
    draftStrokeRef.current = null;
    setDraftStroke(null);
  }

  return (
    <section
      className={`note-topics-panel${view === "board" ? " is-board-view" : ""}`}
      aria-label="Preparation topics"
    >
      <div className="note-topics-heading">
        <div>
          <span className="editor-label">Interview preparation</span>
          <span className="note-topics-hint">
            Sketch out ideas or organize your study plan.
          </span>
        </div>
        <div className="preparation-board-actions">
          <div className="preparation-view-switch" role="group" aria-label="Preparation view">
            <button
              type="button"
              className={view === "board" ? "is-active" : ""}
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              title="Handwriting board"
            >
              <FontAwesomeIcon icon={faChalkboard} />
              <span>Board</span>
            </button>
            <button
              type="button"
              className={view === "tracker" ? "is-active" : ""}
              onClick={() => setView("tracker")}
              aria-pressed={view === "tracker"}
              title="Study plan table"
            >
              <FontAwesomeIcon icon={faList} />
              <span>Tracker</span>
            </button>
          </div>
          <button
            type="button"
            className="note-topic-add"
            onClick={onAddTopic}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add topic
          </button>
        </div>
      </div>
      {view === "board" ? (
        <div className="preparation-board">
          <div className="preparation-board-toolbar">
            <div className="preparation-board-tools" aria-label="Drawing tools">
              <button
                type="button"
                className={`preparation-board-tool${inkTool === "pen" ? " is-active" : ""}`}
                onClick={() => setInkTool("pen")}
                aria-label="Pen tool"
                aria-pressed={inkTool === "pen"}
                title="Draw with pen"
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                className={`preparation-board-tool${inkTool === "eraser" ? " is-active" : ""}`}
                onClick={() => setInkTool("eraser")}
                aria-label="Eraser tool"
                aria-pressed={inkTool === "eraser"}
                title="Erase ink"
              >
                <FontAwesomeIcon icon={faEraser} />
              </button>
              <button
                type="button"
                className={`preparation-board-tool${inkTool === "select" ? " is-active" : ""}`}
                onClick={() => setInkTool("select")}
                aria-label="Select and edit text"
                aria-pressed={inkTool === "select"}
                title="Select and edit text"
              >
                <FontAwesomeIcon icon={faCircleDot} />
              </button>
              <span className="preparation-board-tool-divider" />
              {inkColors.map((ink) => (
                <button
                  type="button"
                  key={ink.value}
                  className={`preparation-ink-swatch${inkColor === ink.value ? " is-selected" : ""}`}
                  style={{ "--preparation-ink": ink.value }}
                  onClick={() => setInkColor(ink.value)}
                  aria-label={ink.label}
                  aria-pressed={inkColor === ink.value}
                  title={ink.label}
                />
              ))}
              <label className="preparation-ink-width" title="Pen width">
                <span>Width</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={inkWidth}
                  onChange={(event) => setInkWidth(Number(event.target.value))}
                  aria-label="Pen width"
                />
              </label>
            </div>
            <div className="preparation-board-page">
              <span>{boardTitle?.trim() || "Untitled preparation"}</span>
              <span className="preparation-board-page-divider">·</span>
              <span>1 / 1</span>
              {namedTopics.length > 0 && (
                <>
                  <span className="preparation-board-page-divider">·</span>
                  <span>{progress}% prepared</span>
                </>
              )}
            </div>
            <span className="preparation-board-mode">
              <span className="preparation-board-page-count">{draftTopics.length + 1} pages</span>
              <button
                type="button"
                className="preparation-board-undo"
                onClick={() => onBoardStrokesChange((strokes) => strokes.slice(0, -1))}
                disabled={boardStrokes.length === 0}
                title="Undo last pen stroke"
                aria-label="Undo last pen stroke"
              >
                <FontAwesomeIcon icon={faRotateLeft} />
              </button>
              <span><FontAwesomeIcon icon={faCircleDot} /> Study board</span>
            </span>
          </div>

          <div
            className={`preparation-board-canvas ink-tool-${inkTool}`}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={finishBoardStroke}
            onPointerCancel={finishBoardStroke}
          >
            <div className="preparation-board-content" ref={boardCanvasRef}>
              <svg
                className="preparation-board-ink"
                viewBox="0 0 1600 1000"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {[...boardStrokes, ...(draftStroke ? [draftStroke] : [])].map((stroke) => (
                  <path
                    key={stroke.id}
                    d={stroke.path}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <div className="preparation-board-title">
                <input
                  value={boardTitle?.trim() || ""}
                  readOnly
                  aria-label="Preparation board title"
                  placeholder="Your preparation plan"
                />
                <span />
              </div>
              {draftTopics.length === 0 ? (
                <div className="preparation-board-empty">
                  <span className="preparation-board-empty-mark">✳</span>
                  <strong>A blank page, a fresh start.</strong>
                  <span>Add a topic to begin sketching out your preparation.</span>
                  <button type="button" onClick={onAddTopic}>
                    <FontAwesomeIcon icon={faPlus} /> Add your first topic
                  </button>
                </div>
              ) : (
                <div className="preparation-board-topics">
                  {draftTopics.map((topic, index) => (
                    <article
                      className={`preparation-board-topic${draggedTopicId === topic.id ? " is-dragging" : ""}`}
                      key={topic.id}
                      onDragOver={(event) => onTopicDragOver(event, topic)}
                      onDrop={(event) => onTopicDrop(event, topic)}
                      onDragLeave={onTopicDragLeave}
                    >
                      <div className="preparation-board-topic-heading">
                        <button
                          type="button"
                          className="preparation-board-topic-number"
                          draggable
                          onDragStart={(event) => onTopicDragStart(event, topic.id)}
                          onDragEnd={onTopicDragEnd}
                          aria-label={`Drag ${topic.title || `topic ${index + 1}`} to change priority`}
                          title="Drag to reorder"
                        >
                          {index + 1})
                        </button>
                        <input
                          className="preparation-board-topic-title"
                          style={{ "--preparation-ink": inkColor }}
                          value={topic.title}
                          onChange={(event) =>
                            onUpdateTopic(topic.id, { title: event.target.value })
                          }
                          placeholder="Write a topic…"
                          aria-label={`Preparation topic ${index + 1}`}
                          maxLength={120}
                        />
                        <button
                          type="button"
                          className={`preparation-board-pin${topic.pinned ? " is-pinned" : ""}`}
                          onClick={() => onTogglePinned(topic.id, !topic.pinned)}
                          aria-label={`${topic.pinned ? "Unpin" : "Pin"} ${topic.title || `topic ${index + 1}`}`}
                          aria-pressed={Boolean(topic.pinned)}
                          title={topic.pinned ? "Unpin topic" : "Pin topic"}
                        >
                          <FontAwesomeIcon icon={faThumbtack} />
                        </button>
                        <select
                          className={`preparation-board-status status-${topic.status}`}
                          value={topic.status}
                          onChange={(event) =>
                            onUpdateTopic(topic.id, { status: event.target.value })
                          }
                          aria-label={`Status for topic ${index + 1}`}
                          title="Preparation status"
                        >
                          <option value="not-started">To do</option>
                          <option value="in-progress">In progress</option>
                          <option value="done">Ready</option>
                        </select>
                        <button
                          type="button"
                          className="preparation-board-remove"
                          onClick={() => onRemoveTopic(topic.id)}
                          aria-label={`Remove preparation topic ${index + 1}`}
                          title="Remove topic"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                      <textarea
                        className="preparation-board-note"
                        value={topic.importantNotes}
                        onChange={(event) =>
                          onUpdateTopic(topic.id, {
                            importantNotes: event.target.value,
                          })
                        }
                        placeholder="Add your key ideas, examples, and explanations…"
                        maxLength={1500}
                        aria-label={`Important notes for topic ${index + 1}`}
                        rows={2}
                      />
                      <div className="preparation-board-issue">
                        <span>↳</span>
                        <textarea
                          value={topic.issues}
                          onChange={(event) =>
                            onUpdateTopic(topic.id, {
                              issues: event.target.value,
                            })
                          }
                          placeholder="Questions to revisit or gaps to fill…"
                          maxLength={1000}
                          aria-label={`Gaps or issues for topic ${index + 1}`}
                          rows={1}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div className="preparation-board-footer">
              <span><span className="preparation-board-live-dot" /> Autosaved with your note</span>
              <span>{namedTopics.length} {namedTopics.length === 1 ? "topic" : "topics"}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
      {namedTopics.length > 0 && (
        <div className="preparation-progress" aria-live="polite">
          <div className="preparation-progress-summary">
            <span>
              <strong>{completedCount}</strong> of {namedTopics.length} topics complete
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="preparation-progress-track"
            role="progressbar"
            aria-label="Interview preparation progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="preparation-progress-counts">
            <span>{inProgressCount} in progress</span>
            <span>
              {namedTopics.length - completedCount - inProgressCount} not started
            </span>
          </div>
        </div>
      )}
      {draftTopics.length > 0 ? (
        <div className="note-topic-table-wrap">
          <table className="note-topic-table">
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Important notes</th>
                <th scope="col">Issues to revisit</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {draftTopics.map((topic, index) => (
                <tr
                  key={topic.id}
                  className={[
                    draggedTopicId === topic.id ? "is-dragging" : "",
                    topicDropTarget?.id === topic.id
                      ? `topic-drop-${topicDropTarget.position}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={(event) => onTopicDragOver(event, topic)}
                  onDrop={(event) => onTopicDrop(event, topic)}
                  onDragLeave={(event) => onTopicDragLeave(event)}
                >
                  <td data-label="Topic">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, { title: event.target.value })
                      }
                      placeholder={`Topic ${index + 1}`}
                      aria-label={`Preparation topic ${index + 1}`}
                      maxLength={120}
                    />
                  </td>
                  <td data-label="Important notes">
                    <textarea
                      value={topic.importantNotes}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, {
                          importantNotes: event.target.value,
                        })
                      }
                      placeholder="Key ideas, examples, and explanations"
                      maxLength={1500}
                      aria-label={`Important notes for topic ${index + 1}`}
                      rows={2}
                    />
                  </td>
                  <td data-label="Issues to revisit">
                    <textarea
                      value={topic.issues}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, { issues: event.target.value })
                      }
                      placeholder="Questions, gaps, or practice to revisit"
                      maxLength={1000}
                      aria-label={`Gaps or issues for topic ${index + 1}`}
                      rows={2}
                    />
                  </td>
                  <td data-label="Status">
                    <select
                      value={topic.status}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, { status: event.target.value })
                      }
                      aria-label={`Status for topic ${index + 1}`}
                      className={`topic-status-select status-${topic.status}`}
                    >
                      <option value="not-started">Not started</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td data-label="Priority">
                    <div className="topic-priority-controls">
                      <button
                        type="button"
                        className="topic-drag-handle"
                        draggable
                        onDragStart={(event) => onTopicDragStart(event, topic.id)}
                        onDragEnd={onTopicDragEnd}
                        aria-label={`Drag ${topic.title || `topic ${index + 1}`} to change priority`}
                        title="Drag to change priority"
                      >
                        <FontAwesomeIcon icon={faGripVertical} />
                      </button>
                      <button
                        type="button"
                        className={`topic-pin-button${topic.pinned ? " is-pinned" : ""}`}
                        onClick={() => onTogglePinned(topic.id, !topic.pinned)}
                        aria-label={`${topic.pinned ? "Unpin" : "Pin"} ${topic.title || `topic ${index + 1}`}`}
                        aria-pressed={Boolean(topic.pinned)}
                        title={topic.pinned ? "Unpin topic" : "Pin to top"}
                      >
                        <FontAwesomeIcon icon={faThumbtack} />
                      </button>
                      <button
                        type="button"
                        className="topic-priority-button"
                        onClick={() => onMoveTopic(topic.id, -1)}
                        disabled={
                          index === 0 ||
                          draftTopics[index - 1].pinned !== topic.pinned
                        }
                        aria-label={`Move ${topic.title || `topic ${index + 1}`} up in priority`}
                        title="Move up"
                      >
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <button
                        type="button"
                        className="topic-priority-button"
                        onClick={() => onMoveTopic(topic.id, 1)}
                        disabled={
                          index === draftTopics.length - 1 ||
                          draftTopics[index + 1].pinned !== topic.pinned
                        }
                        aria-label={`Move ${topic.title || `topic ${index + 1}`} down in priority`}
                        title="Move down"
                      >
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </div>
                  </td>
                  <td data-label="Actions">
                    <button
                      type="button"
                      className="note-topic-remove"
                      onClick={() => onRemoveTopic(topic.id)}
                      aria-label={`Remove preparation topic ${index + 1}`}
                      title="Remove topic"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="note-topics-empty">
          <strong>Build your interview study plan</strong>
          <span>
            Add topics such as fundamentals, system design, or practice questions.
            For each one, keep your key notes and list anything you need to revisit.
          </span>
        </div>
      )}
        </>
      )}
    </section>
  );
}

export default PreparationTracker;
