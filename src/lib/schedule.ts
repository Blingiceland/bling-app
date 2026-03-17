// Google Sheet event schedule fetcher (server-side)

const GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeccv6ZM9cU0IYldavaEvNcil3ONUZDGnfdWy_Uw4GNfvEzAINxAIyu2C_HFzXSw5P0_5_IqLq6YE4/pub?gid=1777729739&single=true&output=csv";

export interface ScheduleEvent {
  id: string;
  title: string;
  dateObj: Date;
  dateDisplay: string;
  time: string;
  entry: string;
  ticketsUrl: string;
  status: "buy" | "door" | "free" | "none";
}

function parseLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (const char of text) {
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === "," && !inQuote) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function fetchScheduleEvents(): Promise<ScheduleEvent[]> {
  try {
    const response = await fetch(GOOGLE_SHEET_URL, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

function parseCSV(text: string): ScheduleEvent[] {
  const lines = text.trim().split("\n");
  // Skip header row (row 0)
  const events: ScheduleEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    // col 0: date like "Thursday 19 March"
    // col 1: start time like "21:00"
    // col 2: band name
    const dateRaw = cols[0]?.replace(/\r/g, "").trim();
    const time = cols[1]?.replace(/\r/g, "").trim() || "21:00";
    const band = cols[2]?.replace(/\r/g, "").trim();

    // Skip rows with no band
    if (!band || !dateRaw) continue;

    // Parse "Thursday 19 March" → Date in 2026
    // Extract day number and month name
    const parts = dateRaw.split(" ");
    // parts: ["Thursday", "19", "March"] or ["Friday", "20", "March"]
    if (parts.length < 3) continue;
    const day = parts[1];
    const month = parts[2];
    const dateStr = `${day} ${month} 2026 ${time}`;
    const dateObj = new Date(dateStr);

    if (isNaN(dateObj.getTime())) continue;

    const dateDisplay = dateObj.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    events.push({
      id: `evt-${i}`,
      title: band,
      dateObj,
      dateDisplay,
      time,
      entry: "Free",
      ticketsUrl: "",
      status: "free",
    });
  }

  // Only show upcoming events (from today), sort ascending
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events
    .filter((e) => e.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}

