import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faPlus,
  faThumbtack,
  faXmark,
  faGripVertical,
} from "@fortawesome/free-solid-svg-icons";

function PreparationTracker({
  draftTopics,
  draggedTopicId,
  topicDropTarget,
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

  return (
    <section className="note-topics-panel" aria-label="Preparation topics">
      <div className="note-topics-heading">
        <div>
          <span className="editor-label">Interview preparation tracker</span>
          <span className="note-topics-hint">
            Pin key topics, then order each group from highest to lowest priority.
          </span>
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
    </section>
  );
}

export default PreparationTracker;
