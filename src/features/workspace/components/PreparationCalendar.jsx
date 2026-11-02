import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCalendarPlus,
  faChevronLeft,
  faChevronRight,
  faClock,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const STORAGE_KEY = "vsr-preparation-calendar-v1";
const eventTypes = ["Study session", "Interview preparation", "Training", "Project review"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStoredEvents() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const parsed = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (event) =>
        !event ||
        typeof event.id !== "string" ||
        typeof event.title !== "string" ||
        typeof event.date !== "string" ||
        typeof event.startTime !== "string" ||
        typeof event.endTime !== "string" ||
        typeof event.type !== "string" ||
        (event.comments !== undefined &&
          (!Array.isArray(event.comments) ||
            event.comments.some(
              (comment) =>
                !comment ||
                typeof comment.id !== "string" ||
                typeof comment.author !== "string" ||
                typeof comment.body !== "string" ||
                typeof comment.createdAt !== "string",
            ))),
    )
  ) {
    throw new Error("Saved calendar data is invalid.");
  }
  return parsed;
}

function getInitialCalendarState() {
  try {
    return { events: getStoredEvents(), storageReady: true, message: "" };
  } catch (error) {
    console.error("Could not load preparation calendar events.", error);
    return {
      events: [],
      storageReady: false,
      message: "Calendar data could not be loaded from this browser.",
    };
  }
}

function formatSelectedDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function PreparationCalendar({ profile }) {
  const [initialCalendarState] = useState(getInitialCalendarState);
  const [events, setEvents] = useState(initialCalendarState.events);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [todayKey] = useState(() => toDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [storageReady] = useState(initialCalendarState.storageReady);
  const [message, setMessage] = useState(initialCalendarState.message);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
    );
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
    ).getDate();
    const cells = [];

    for (let index = 0; index < mondayOffset; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [visibleMonth]);

  const selectedEvents = useMemo(
    () =>
      events
        .filter((event) => event.date === selectedDate)
        .sort((first, second) => first.startTime.localeCompare(second.startTime)),
    [events, selectedDate],
  );

  function saveEvents(nextEvents) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
      setEvents(nextEvents);
      setMessage("");
      return true;
    } catch (error) {
      console.error("Could not save preparation calendar events.", error);
      setMessage("Could not save this event. Check browser storage and try again.");
      return false;
    }
  }

  function handleCreateEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");
    const type = String(formData.get("type") ?? eventTypes[0]);
    const notes = String(formData.get("notes") ?? "").trim();

    if (!title || !date || !startTime || !endTime || endTime <= startTime) {
      setMessage("Add a title, date, and valid time range to schedule an event.");
      return;
    }

    const newEvent = {
      id: crypto.randomUUID(),
      title,
      date,
      startTime,
      endTime,
      type,
      notes,
      comments: [],
    };
    if (!saveEvents([...events, newEvent])) return;

    setSelectedDate(date);
    setVisibleMonth(new Date(`${date}T12:00:00`));
    setIsFormOpen(false);
  }

  function handleDeleteEvent(eventId) {
    saveEvents(events.filter((event) => event.id !== eventId));
  }

  function handleAddComment(eventId, event) {
    event.preventDefault();
    const body = (commentDrafts[eventId] ?? "").trim();
    if (!body) return;

    const updatedEvents = events.map((calendarEvent) =>
      calendarEvent.id === eventId
        ? {
            ...calendarEvent,
            comments: [
              ...(calendarEvent.comments ?? []),
              {
                id: crypto.randomUUID(),
                author: profile.name.trim() || "Demo member",
                body,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : calendarEvent,
    );
    if (saveEvents(updatedEvents)) {
      setCommentDrafts((drafts) => ({ ...drafts, [eventId]: "" }));
    }
  }

  function changeMonth(offset) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  }

  const defaultStartTime = "09:00";
  const defaultEndTime = "10:00";

  return (
    <div className="preparation-calendar">
      <section className="calendar-intro-card">
        <div className="calendar-intro-copy">
          <span className="company-eyebrow">PLAN YOUR PROGRESS</span>
          <h2>Make time for what you want to learn.</h2>
          <p>
            Schedule study sessions, training, interview preparation, and
            project reviews in one simple calendar.
          </p>
        </div>
        <button
          type="button"
          className="primary-action calendar-add-button"
          onClick={() => {
            setMessage("");
            setIsFormOpen(true);
          }}
          disabled={!storageReady}
        >
          <FontAwesomeIcon icon={faCalendarPlus} />
          <span>Add preparation event</span>
        </button>
      </section>

      <div className="calendar-local-notice" role="note">
        Events are saved in this browser only. They are not shared, backed up,
        or synced with Google Calendar, Outlook, or other accounts.
      </div>

      {message && (
        <div className="workspace-alert" role="alert">
          {message}
        </div>
      )}

      <section className="calendar-layout" aria-label="Preparation calendar">
        <div className="calendar-month-panel">
          <header className="calendar-toolbar">
            <div className="calendar-month-title">
              <span className="calendar-icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
              <h2>
                {visibleMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="calendar-month-actions">
              <button
                type="button"
                className="calendar-today-button"
                onClick={() => {
                  setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                  setSelectedDate(todayKey);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="calendar-arrow-button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                className="calendar-arrow-button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </header>

          <div className="calendar-grid" role="grid" aria-label="Calendar month">
            {weekDays.map((day) => (
              <div className="calendar-weekday" role="columnheader" key={day}>
                {day}
              </div>
            ))}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div className="calendar-day is-empty" role="gridcell" key={`empty-${index}`} />;
              }
              const dateKey = toDateKey(date);
              const dayEvents = events.filter((calendarEvent) => calendarEvent.date === dateKey);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;
              return (
                <button
                  type="button"
                  className={`calendar-day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                  role="gridcell"
                  aria-label={`${date.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
                  aria-pressed={isSelected}
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                >
                  <span>{date.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <span className="calendar-event-dots" aria-hidden="true">
                      {dayEvents.slice(0, 3).map((calendarEvent) => (
                        <i key={calendarEvent.id} />
                      ))}
                    </span>
                  )}
                  {dayEvents.length > 0 && (
                    <small>{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}</small>
                  )}
                </button>
              );
            })}
          </div>
          <footer className="calendar-legend">
            <span><i className="calendar-legend-today" />Today</span>
            <span><i className="calendar-legend-event" />Scheduled preparation</span>
          </footer>
        </div>

        <aside className="calendar-agenda-panel" aria-labelledby="calendar-agenda-title">
          <div className="calendar-agenda-heading">
            <span className="company-eyebrow">YOUR AGENDA</span>
            <h2 id="calendar-agenda-title">{formatSelectedDate(selectedDate)}</h2>
            <p>{selectedEvents.length} scheduled event{selectedEvents.length === 1 ? "" : "s"}</p>
          </div>
          {selectedEvents.length ? (
            <ul className="calendar-event-list">
              {selectedEvents.map((calendarEvent) => (
                <li className="calendar-event-card" key={calendarEvent.id}>
                  <span className="calendar-event-accent" />
                  <div className="calendar-event-content">
                    <span className="calendar-event-type">{calendarEvent.type}</span>
                    <strong>{calendarEvent.title}</strong>
                    <span className="calendar-event-time">
                      <FontAwesomeIcon icon={faClock} />
                      {calendarEvent.startTime} – {calendarEvent.endTime}
                    </span>
                    {calendarEvent.notes && <p>{calendarEvent.notes}</p>}
                  </div>
                  <button
                    type="button"
                    className="calendar-delete-button"
                    aria-label={`Delete ${calendarEvent.title}`}
                    onClick={() => handleDeleteEvent(calendarEvent.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <section className="calendar-comments" aria-label={`Learning comments for ${calendarEvent.title}`}>
                    <div className="calendar-comments-heading">
                      <strong>Learning comments</strong>
                      <span>{calendarEvent.comments?.length ?? 0}</span>
                    </div>
                    {calendarEvent.comments?.length ? (
                      <ul className="calendar-comment-list">
                        {calendarEvent.comments.map((comment) => (
                          <li className="calendar-comment" key={comment.id}>
                            <span className="calendar-comment-avatar">
                              {comment.author.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "D"}
                            </span>
                            <div>
                              <span className="calendar-comment-meta">
                                <strong>{comment.author}</strong>
                                <time dateTime={comment.createdAt}>
                                  {new Date(comment.createdAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </time>
                              </span>
                              <p>{comment.body}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="calendar-comments-empty">Start a supportive discussion about this session.</p>
                    )}
                    <form
                      className="calendar-comment-form"
                      onSubmit={(event) => handleAddComment(calendarEvent.id, event)}
                    >
                      <label className="visually-hidden" htmlFor={`comment-${calendarEvent.id}`}>
                        Add a learning comment
                      </label>
                      <textarea
                        id={`comment-${calendarEvent.id}`}
                        value={commentDrafts[calendarEvent.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((drafts) => ({
                            ...drafts,
                            [calendarEvent.id]: event.target.value,
                          }))
                        }
                        placeholder={`Comment as ${profile.name || "Demo member"}...`}
                        rows="2"
                        maxLength="500"
                        required
                      />
                      <button type="submit" className="secondary-action">Comment</button>
                    </form>
                  </section>
                </li>
              ))}
            </ul>
          ) : (
            <div className="calendar-empty-agenda">
              <span><FontAwesomeIcon icon={faCalendarDays} /></span>
              <strong>Nothing planned yet</strong>
              <p>Choose a date and add a preparation event to make it part of your plan.</p>
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setMessage("");
                  setIsFormOpen(true);
                }}
                disabled={!storageReady}
              >
                Add an event
              </button>
            </div>
          )}
        </aside>
      </section>

      {isFormOpen && (
        <div className="calendar-modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <section
            className="calendar-event-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-event-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="calendar-dialog-close"
              aria-label="Close event form"
              onClick={() => setIsFormOpen(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <span className="calendar-icon"><FontAwesomeIcon icon={faCalendarPlus} /></span>
            <span className="company-eyebrow">PREPARATION PLANNER</span>
            <h2 id="calendar-event-dialog-title">Add a preparation event</h2>
            <p>Plan a focused session and keep your next step visible.</p>
            <form className="calendar-event-form" onSubmit={handleCreateEvent}>
              <label>
                Event title
                <input name="title" type="text" maxLength="100" placeholder="e.g. Review model evaluation" required autoFocus />
              </label>
              <label>
                Event type
                <select name="type" defaultValue={eventTypes[0]}>
                  {eventTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>
                Date
                <input name="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} required />
              </label>
              <div className="calendar-time-fields">
                <label>
                  Start
                  <input name="startTime" type="time" defaultValue={defaultStartTime} required />
                </label>
                <label>
                  End
                  <input name="endTime" type="time" defaultValue={defaultEndTime} required />
                </label>
              </div>
              <label>
                Notes <span className="calendar-optional">(optional)</span>
                <textarea name="notes" rows="3" maxLength="500" placeholder="What would you like to prepare?" />
              </label>
              <div className="calendar-form-actions">
                <button type="button" className="secondary-action" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="primary-action">Save event</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default PreparationCalendar;
