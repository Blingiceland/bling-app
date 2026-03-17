"use client";

import { useState } from "react";
import type { ScheduleEvent } from "@/lib/schedule";

interface Props {
  events: ScheduleEvent[];
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function WeeklySchedule({ events }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  const weekEnd = addDays(weekStart, 6);

  const weekLabel = (() => {
    const s = weekStart;
    const e = weekEnd;
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()}–${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTH_NAMES[s.getMonth()]} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
  })();

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  // Build 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Events for each day
  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.dateObj, day));

  const hasAnyEvents = days.some((d) => eventsForDay(d).length > 0);

  return (
    <div style={{ width: "100%", backgroundColor: "#0a0a0a", padding: "60px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <button
            onClick={prevWeek}
            style={{
              background: "transparent",
              border: "1px solid var(--color-gold)",
              color: "var(--color-gold)",
              fontSize: "1.5rem",
              width: "48px",
              height: "48px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-gold)";
              (e.currentTarget as HTMLButtonElement).style.color = "#000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-gold)";
            }}
            aria-label="Previous week"
          >
            ←
          </button>

          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2rem",
                color: "var(--color-gold)",
                letterSpacing: "2px",
                margin: 0,
              }}
            >
              WHAT&apos;S ON
            </h2>
            <p
              style={{
                fontFamily: "var(--font-subheading)",
                fontSize: "1rem",
                color: "#aaa",
                margin: "6px 0 0",
                letterSpacing: "1px",
              }}
            >
              {weekLabel}
            </p>
          </div>

          <button
            onClick={nextWeek}
            style={{
              background: "transparent",
              border: "1px solid var(--color-gold)",
              color: "var(--color-gold)",
              fontSize: "1.5rem",
              width: "48px",
              height: "48px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-gold)";
              (e.currentTarget as HTMLButtonElement).style.color = "#000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-gold)";
            }}
            aria-label="Next week"
          >
            →
          </button>
        </div>

        {/* Week grid */}
        {!hasAnyEvents ? (
          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              padding: "40px 0",
            }}
          >
            No events scheduled this week.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {days.map((day, i) => {
              const dayEvents = eventsForDay(day);
              const isToday = isSameDay(day, new Date());
              if (dayEvents.length === 0) return null;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    borderLeft: isToday
                      ? "3px solid var(--color-gold)"
                      : "3px solid #222",
                    padding: "16px 20px",
                    backgroundColor: isToday
                      ? "rgba(200, 155, 60, 0.05)"
                      : "transparent",
                    gap: "20px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Day label */}
                  <div style={{ minWidth: "130px" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.1rem",
                        color: isToday ? "var(--color-gold)" : "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {DAY_NAMES[i]}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.85rem",
                        color: "#666",
                        marginTop: "2px",
                      }}
                    >
                      {day.getDate()} {MONTH_NAMES[day.getMonth()]}
                    </div>
                  </div>

                  {/* Events */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontSize: "1.2rem",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              color: "#fff",
                            }}
                          >
                            {evt.title}
                          </span>
                          {evt.time && (
                            <span
                              style={{
                                marginLeft: "12px",
                                fontFamily: "var(--font-body)",
                                fontSize: "0.9rem",
                                color: "var(--color-gold)",
                              }}
                            >
                              {evt.time}
                            </span>
                          )}
                        </div>
                        {evt.status === "buy" && evt.ticketsUrl && (
                          <a
                            href={evt.ticketsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-buy"
                            style={{ fontSize: "0.8rem", padding: "6px 16px" }}
                          >
                            Buy Tickets
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
