export const PREPARATION_CALENDAR_STORAGE_KEY = "vsr-preparation-calendar-v1";

export function readPreparationCalendar() {
  try {
    const stored = window.localStorage.getItem(PREPARATION_CALENDAR_STORAGE_KEY);
    if (!stored) return { events: [], error: "" };

    const events = JSON.parse(stored);
    if (
      !Array.isArray(events) ||
      events.some(
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

    return { events, error: "" };
  } catch (error) {
    console.error("Could not load preparation calendar events.", error);
    return {
      events: [],
      error: "Calendar data could not be loaded from this browser.",
    };
  }
}
