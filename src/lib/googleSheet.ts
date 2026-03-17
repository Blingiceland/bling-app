const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvUrITZ0D2z_Y0e6YHqpL2-1Ju3ox0xhlT0DIG63A9SBl90LfiUCsJKfk5yByVVbfyzcNwGhgZuean/pub?output=csv';

export interface DEvent {
  id: string;
  title: string;
  dateObj: Date;
  dateDisplay: string;
  time: string;
  entry: string;
  ticketsUrl: string;
  status: 'buy' | 'door' | 'free' | 'none';
}

export const fetchEvents = async (): Promise<DEvent[]> => {
  try {
    const response = await fetch(GOOGLE_SHEET_URL, { next: { revalidate: 300 } });
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
};

const parseLine = (text: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (const char of text) {
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
};

const parseCSV = (text: string): DEvent[] => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const idx = {
    date: headers.findIndex(h => h.toLowerCase() === 'date'),
    time: headers.findIndex(h => h.toLowerCase() === 'time'),
    title: headers.findIndex(h => h.toLowerCase() === 'title'),
    entry: headers.findIndex(h => h.toLowerCase() === 'entry'),
    tickets: headers.findIndex(h => h.toLowerCase() === 'tickets'),
  };

  const events: DEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseLine(line);
    if (cols.length < 3) continue;

    const dateRaw = cols[idx.date];
    const time = cols[idx.time];
    const title = cols[idx.title];
    const entry = cols[idx.entry];
    const tickets = cols[idx.tickets] || '';

    let dateObj = new Date();
    if (dateRaw.includes('.')) {
      const parts = dateRaw.split('.');
      dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${time || '00:00'}`);
    } else {
      dateObj = new Date(`${dateRaw}T${time || '00:00'}`);
    }

    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateDisplay = dateObj.toLocaleDateString('en-GB', dateOptions);

    let status: DEvent['status'] = 'none';
    let ticketsUrl = '';

    const ticketsLower = tickets.toLowerCase();
    const entryLower = entry.toLowerCase();

    if (ticketsLower.startsWith('http')) {
      status = 'buy';
      ticketsUrl = tickets;
    } else if (ticketsLower.includes('at door')) {
      status = 'door';
    } else if (entryLower.includes('free') || ticketsLower.includes('free')) {
      status = 'free';
    }

    events.push({
      id: `evt-${i}`,
      title: title.replace(/^"|"$/g, ''),
      dateObj,
      dateDisplay,
      time,
      entry: entry.replace(/^"|"$/g, ''),
      ticketsUrl,
      status,
    });
  }

  return events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
};
