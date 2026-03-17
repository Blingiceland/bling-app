import { fetchScheduleEvents } from "@/lib/schedule";

export const metadata = {
  title: "What's On | Dillon",
  description: "Upcoming events, live music and DJs at Dillon Whiskey Bar, Reykjavík.",
};

export default async function WhatsOnPage() {
  const events = await fetchScheduleEvents();

  return (
    <div style={{ paddingTop: "50px", minHeight: "100vh", paddingBottom: "100px", backgroundColor: "#000", color: "#fff" }}>
      <div style={{ maxWidth: "1000px", width: "95%", margin: "0 auto", textAlign: "center" }}>
        <h1
          className="text-gold"
          style={{
            fontSize: "3.5rem",
            marginBottom: "40px",
            fontFamily: "var(--font-heading)",
            letterSpacing: "2px",
          }}
        >
          Upcoming Events
        </h1>

        {events.length === 0 && <p>No upcoming events scheduled.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "30px", alignItems: "center" }}>
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-row">
                {/* Date & Time */}
                <div className="event-date" style={{ textAlign: "center", minWidth: "150px" }}>
                  <h3 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, textTransform: "uppercase", lineHeight: 1.2 }}>
                    {event.dateDisplay}
                  </h3>
                  <p className="text-gold" style={{ margin: "5px 0 0 0", fontSize: "1.2rem" }}>
                    {event.time}
                  </p>
                </div>

                {/* Title & Entry */}
                <div className="event-info">
                  <h2 style={{ fontSize: "2rem", fontFamily: "var(--font-heading)", margin: "0 0 10px 0", textTransform: "uppercase" }}>
                    {event.title}
                  </h2>
                  <p style={{ color: "#aaa", fontStyle: "italic", margin: 0 }}>
                    Entry: <span style={{ color: "#fff" }}>{event.entry}</span>
                  </p>
                </div>

                {/* Action Button */}
                <div className="event-action">
                  {event.status === "buy" && (
                    <a href={event.ticketsUrl} target="_blank" rel="noopener noreferrer" className="btn-buy">
                      Buy Tickets
                    </a>
                  )}
                  {event.status === "door" && <div className="btn-door">Tickets at Door</div>}
                  {event.status === "free" && <div className="btn-free">Free Entry</div>}
                  {event.status === "none" && (
                    <div style={{ padding: "10px 24px", color: "#666", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
                      -
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
