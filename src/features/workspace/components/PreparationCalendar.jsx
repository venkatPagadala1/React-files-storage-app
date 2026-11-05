import { useEffect, useMemo, useState } from "react";
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
import { loadAccountData, saveAccountData } from "../../../lib/accountStorage.js";

const eventTypes = ["Study session", "Interview preparation", "Training", "Project review"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function PreparationCalendar({ profile, navigationRequest, onEventsChange, onIssueChange }) {
  const [events, setEvents] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [todayKey] = useState(() => toDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    loadAccountData("calendar")
      .then((saved) => {
        if (!active) return;
        setEvents(Array.isArray(saved?.events) ? saved.events : []);
        setStorageReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setMessage(`Could not load your calendar: ${error.message}`);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    onEventsChange?.(events);
  }, [events, onEventsChange]);

  useEffect(() => {
    onIssueChange?.(message);
  }, [message, onIssueChange]);

  useEffect(() => {
    if (!navigationRequest?.date) return;
    setSelectedDate(navigationRequest.date);
    setVisibleMonth(new Date(`${navigationRequest.date}T12:00:00`));
  }, [navigationRequest]);

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

  async function saveEvents(nextEvents) {
    try {
      await saveAccountData("calendar", { events: nextEvents });
      setEvents(nextEvents);
      setMessage("");
      return true;
    } catch (error) {
      console.error("Could not save preparation calendar events.", error);
      setMessage(`Could not save this event: ${error.message}`);
      return false;
    }
  }

  async function handleCreateEvent(event) {
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
    if (!await saveEvents([...events, newEvent])) return;

    setSelectedDate(date);
    setVisibleMonth(new Date(`${date}T12:00:00`));
    setIsFormOpen(false);
  }

  async function handleDeleteEvent(eventId) {
    await saveEvents(events.filter((event) => event.id !== eventId));
  }

  async function handleAddComment(eventId, event) {
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
                author: profile.name.trim() || profile.email,
                body,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : calendarEvent,
    );
    if (await saveEvents(updatedEvents)) {
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
    <div className="preparation-calendar grid gap-4 pb-6">
      <section className="calendar-intro-card relative flex items-center justify-between gap-5 overflow-hidden p-[clamp(20px,3vw,30px)] max-[620px]:flex-col max-[620px]:items-start">
        <div className="calendar-intro-copy">
          <span className="company-eyebrow">PLAN YOUR PROGRESS</span>
          <h2 className="mt-2 text-[clamp(1.35rem,2.3vw,1.8rem)] font-[760] tracking-[-0.05em]">Make time for what you want to learn.</h2>
          <p className="mt-[7px] max-w-[640px] text-[0.78rem] leading-[1.6]">
            Schedule study sessions, training, interview preparation, and
            project reviews in one simple calendar.
          </p>
        </div>
        <button
          type="button"
          className="primary-action calendar-add-button min-h-[43px] flex-[0_0_auto] rounded-[10px] max-[620px]:w-full"
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

      <div className="calendar-local-notice px-[14px] py-[11px] text-[0.68rem] leading-[1.55]" role="note">
        Events are saved to your signed-in account and are not shared with other accounts.
      </div>

      {message && (
        <div className="workspace-alert" role="alert">
          {message}
        </div>
      )}

      <section className="calendar-layout grid grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)] items-start gap-[15px] max-[900px]:grid-cols-[minmax(0,1fr)]" aria-label="Preparation calendar">
        <div className="calendar-month-panel min-w-0 p-[clamp(15px,2vw,22px)] max-[620px]:p-[14px]">
          <header className="calendar-toolbar mb-[17px] flex items-center justify-between gap-3">
            <div className="calendar-month-title flex min-w-0 items-center gap-[10px]">
              <span className="calendar-icon grid h-[37px] w-[37px] flex-[0_0_auto] place-items-center rounded-[11px]"><FontAwesomeIcon icon={faCalendarDays} /></span>
              <h2 className="m-0 text-[clamp(1rem,1.8vw,1.25rem)] font-[760] tracking-[-0.04em]">
                {visibleMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="calendar-month-actions flex items-center gap-[6px] max-[620px]:gap-1">
              <button
                type="button"
                className="calendar-today-button min-h-[34px] rounded-lg px-[10px] text-[0.67rem] font-[650] [font-family:inherit] cursor-pointer"
                onClick={() => {
                  setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                  setSelectedDate(todayKey);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="calendar-arrow-button grid h-[34px] w-[34px] min-h-[34px] place-items-center rounded-lg text-[0.67rem] font-[650] [font-family:inherit] cursor-pointer"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                className="calendar-arrow-button grid h-[34px] w-[34px] min-h-[34px] place-items-center rounded-lg text-[0.67rem] font-[650] [font-family:inherit] cursor-pointer"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </header>

          <div className="calendar-grid grid grid-cols-7 overflow-hidden rounded-[10px]" role="grid" aria-label="Calendar month">
            {weekDays.map((day) => (
              <div className="calendar-weekday grid min-h-[36px] place-items-center text-[0.62rem] font-[730]" role="columnheader" key={day}>
                {day}
              </div>
            ))}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div className="calendar-day is-empty relative flex min-w-0 min-h-[80px] flex-col items-start gap-[7px] px-2 py-[9px] text-[0.69rem] max-[620px]:min-h-[61px] max-[620px]:items-center max-[620px]:px-1 max-[620px]:py-[5px]" role="gridcell" key={`empty-${index}`} />;
              }
              const dateKey = toDateKey(date);
              const dayEvents = events.filter((calendarEvent) => calendarEvent.date === dateKey);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;
              return (
                <button
                  type="button"
                  className={`calendar-day relative flex min-w-0 min-h-[80px] flex-col items-start gap-[7px] px-2 py-[9px] text-[0.69rem] [font-family:inherit] cursor-pointer max-[620px]:min-h-[61px] max-[620px]:items-center max-[620px]:px-1 max-[620px]:py-[5px]${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
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
                  <span className="grid h-[27px] w-[27px] place-items-center rounded-full text-[0.69rem] font-[650] max-[620px]:h-[25px] max-[620px]:w-[25px]">{date.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <span className="calendar-event-dots flex gap-[3px]" aria-hidden="true">
                      {dayEvents.slice(0, 3).map((calendarEvent) => (
                        <i className="block h-[6px] w-[6px] rounded-full" key={calendarEvent.id} />
                      ))}
                    </span>
                  )}
                  {dayEvents.length > 0 && (
                    <small className="max-w-full overflow-hidden text-[0.55rem] font-[670] text-ellipsis whitespace-nowrap max-[620px]:hidden">{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}</small>
                  )}
                </button>
              );
            })}
          </div>
          <footer className="calendar-legend flex flex-wrap gap-[15px] pt-[13px]">
            <span className="inline-flex items-center gap-[6px] text-[0.59rem]"><i className="calendar-legend-today block h-[6px] w-[6px] rounded-full" />Today</span>
            <span className="inline-flex items-center gap-[6px] text-[0.59rem]"><i className="calendar-legend-event block h-[6px] w-[6px] rounded-full" />Scheduled preparation</span>
          </footer>
        </div>

        <aside className="calendar-agenda-panel min-w-0 p-[19px] max-[620px]:p-[14px]" aria-labelledby="calendar-agenda-title">
          <div className="calendar-agenda-heading pb-[15px]">
            <span className="company-eyebrow">YOUR AGENDA</span>
            <h2 className="mt-[7px] mb-0 text-[0.98rem] font-[740] leading-[1.4]" id="calendar-agenda-title">{formatSelectedDate(selectedDate)}</h2>
            <p className="mt-[5px] mb-0 text-[0.63rem]">{selectedEvents.length} scheduled event{selectedEvents.length === 1 ? "" : "s"}</p>
          </div>
          {selectedEvents.length ? (
            <ul className="calendar-event-list mt-3 grid gap-[10px] p-0 list-none">
              {selectedEvents.map((calendarEvent) => (
                <li className="calendar-event-card relative grid min-w-0 grid-cols-[3px_minmax(0,1fr)_28px] gap-[10px] rounded-[11px] p-[13px_10px_12px_13px]" key={calendarEvent.id}>
                  <span className="calendar-event-accent rounded-[99px]" />
                  <div className="calendar-event-content grid min-w-0 justify-items-start gap-[6px]">
                    <span className="calendar-event-type text-[0.54rem] font-[780] tracking-[0.08em] uppercase">{calendarEvent.type}</span>
                    <strong className="text-[0.75rem] [overflow-wrap:anywhere]">{calendarEvent.title}</strong>
                    <span className="calendar-event-time flex items-center gap-[6px] text-[0.61rem]">
                      <FontAwesomeIcon icon={faClock} />
                      {calendarEvent.startTime} – {calendarEvent.endTime}
                    </span>
                    {calendarEvent.notes && <p className="m-0 text-[0.63rem] leading-[1.5] [overflow-wrap:anywhere]">{calendarEvent.notes}</p>}
                  </div>
                  <button
                    type="button"
                    className="calendar-delete-button grid h-7 w-7 place-items-center rounded-[7px] cursor-pointer"
                    aria-label={`Delete ${calendarEvent.title}`}
                    onClick={() => handleDeleteEvent(calendarEvent.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <section className="calendar-comments col-[2/-1] min-w-0 pt-[10px]" aria-label={`Learning comments for ${calendarEvent.title}`}>
                    <div className="calendar-comments-heading flex items-center justify-between gap-2">
                      <strong className="text-[0.64rem]">Learning comments</strong>
                      <span className="grid h-[19px] min-w-[19px] place-items-center rounded-full text-[0.56rem] font-bold">{calendarEvent.comments?.length ?? 0}</span>
                    </div>
                    {calendarEvent.comments?.length ? (
                      <ul className="calendar-comment-list my-[9px] grid gap-[10px] p-0 list-none">
                        {calendarEvent.comments.map((comment) => (
                          <li className="calendar-comment grid grid-cols-[25px_minmax(0,1fr)] gap-2" key={comment.id}>
                            <span className="calendar-comment-avatar grid h-[25px] w-[25px] place-items-center rounded-full text-[0.53rem] font-[780]">
                              {comment.author.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "D"}
                            </span>
                            <div>
                              <span className="calendar-comment-meta flex items-center justify-between gap-2">
                                <strong className="overflow-hidden text-[0.59rem] text-ellipsis whitespace-nowrap">{comment.author}</strong>
                                <time className="flex-[0_0_auto] text-[0.5rem]" dateTime={comment.createdAt}>
                                  {new Date(comment.createdAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </time>
                              </span>
                              <p className="mt-1 mb-0 text-[0.61rem] leading-[1.5] [overflow-wrap:anywhere]">{comment.body}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="calendar-comments-empty mt-1 mb-0 text-[0.61rem] leading-[1.5] [overflow-wrap:anywhere]">Start a supportive discussion about this session.</p>
                    )}
                    <form
                      className="calendar-comment-form mt-[10px] grid justify-items-end gap-[7px]"
                      onSubmit={(event) => handleAddComment(calendarEvent.id, event)}
                    >
                      <label className="visually-hidden" htmlFor={`comment-${calendarEvent.id}`}>
                        Add a learning comment
                      </label>
                      <textarea
                        className="w-full min-h-[54px] rounded-lg border px-[9px] py-2 text-[0.62rem] [font-family:inherit] resize-y outline-none"
                        id={`comment-${calendarEvent.id}`}
                        value={commentDrafts[calendarEvent.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((drafts) => ({
                            ...drafts,
                            [calendarEvent.id]: event.target.value,
                          }))
                        }
                        placeholder={`Comment as ${profile.name || "You"}...`}
                        rows="2"
                        maxLength="500"
                        required
                      />
                      <button type="submit" className="secondary-action min-h-[29px] px-[10px] text-[0.59rem]">Comment</button>
                    </form>
                  </section>
                </li>
              ))}
            </ul>
          ) : (
            <div className="calendar-empty-agenda flex min-h-[230px] flex-col items-center justify-center px-[10px] py-5 text-center">
              <span className="grid h-[43px] w-[43px] place-items-center rounded-[13px]"><FontAwesomeIcon icon={faCalendarDays} /></span>
              <strong className="mt-3 text-[0.75rem]">Nothing planned yet</strong>
              <p className="mt-[6px] mb-3 max-w-[220px] text-[0.63rem] leading-[1.5]">Choose a date and add a preparation event to make it part of your plan.</p>
              <button
                type="button"
                className="secondary-action min-h-[33px]"
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
        <div className="calendar-modal-backdrop fixed inset-0 z-20 grid place-items-center overflow-y-auto p-5" onClick={() => setIsFormOpen(false)}>
          <section
            className="calendar-event-dialog relative w-[min(100%,480px)] max-h-[min(90vh,780px)] overflow-y-auto rounded-[18px] p-[25px] max-[620px]:px-[17px] max-[620px]:py-[21px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-event-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="calendar-dialog-close absolute top-4 right-4 grid h-[34px] w-[34px] place-items-center rounded-[9px] cursor-pointer"
              aria-label="Close event form"
              onClick={() => setIsFormOpen(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <span className="calendar-icon mb-[13px] grid h-[37px] w-[37px] place-items-center rounded-[11px]"><FontAwesomeIcon icon={faCalendarPlus} /></span>
            <span className="company-eyebrow">PREPARATION PLANNER</span>
            <h2 className="mt-2 mb-0 text-[1.35rem] tracking-[-0.04em]" id="calendar-event-dialog-title">Add a preparation event</h2>
            <p className="mt-[6px] mb-[18px] text-[0.7rem]">Plan a focused session and keep your next step visible.</p>
            <form className="calendar-event-form grid gap-[13px]" onSubmit={handleCreateEvent}>
              <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
                Event title
                <input className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none" name="title" type="text" maxLength="100" placeholder="e.g. Review model evaluation" required autoFocus />
              </label>
              <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
                Event type
                <select className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none" name="type" defaultValue={eventTypes[0]}>
                  {eventTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
                Date
                <input className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none" name="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} required />
              </label>
              <div className="calendar-time-fields grid grid-cols-2 gap-[10px]">
                <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
                  Start
                  <input className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none" name="startTime" type="time" defaultValue={defaultStartTime} required />
                </label>
                <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
                  End
                  <input className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none" name="endTime" type="time" defaultValue={defaultEndTime} required />
                </label>
              </div>
              <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
                Notes <span className="calendar-optional font-[450]">(optional)</span>
                <textarea className="w-full min-h-[78px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] resize-y outline-none" name="notes" rows="3" maxLength="500" placeholder="What would you like to prepare?" />
              </label>
              <div className="calendar-form-actions flex items-center justify-end gap-[9px]">
                <button type="button" className="secondary-action min-h-[39px]" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="primary-action min-h-[39px]">Save event</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default PreparationCalendar;
