
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvUrITZ0D2z_Y0e6YHqpL2-1Ju3ox0xhlT0DIG63A9SBl90LfiUCsJKfk5yByVVbfyzcNwGhgZuean/pub?output=csv';

/**
 * Parsed Event definition
 * @typedef {Object} DEvent
 * @property {string} id
 * @property {string} title
 * @property {Date} dateObj
 * @property {string} dateDisplay
 * @property {string} time
 * @property {string} entry
 * @property {string} ticketsUrl
 * @property {'buy' | 'door' | 'free' | 'none'} status
 */

export const fetchEvents = async () => {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return [];
    }
};

const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // We expect headers: Date, Time, Title, Entry, Tickets
    // Map headers to indices
    const idx = {
        date: headers.findIndex(h => h.toLowerCase() === 'date'),
        time: headers.findIndex(h => h.toLowerCase() === 'time'),
        title: headers.findIndex(h => h.toLowerCase() === 'title'),
        entry: headers.findIndex(h => h.toLowerCase() === 'entry'),
        tickets: headers.findIndex(h => h.toLowerCase() === 'tickets'),
    };

    const events = [];

    // Simple CSV splitter that respects quotes
    // But given the data provided, simple split by comma might suffice if no commas in titles.
    // To be safe, let's use a regex that matches CSV fields including quotes.
    const csvRegex = /(?:,|\n|^)("(?:(?:"")*|[^"]*)*"|[^",\n]*|(?:\n|$))/g;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Note: Simple split might break if titles have commas. 
        // Using a more robust parser for lines:
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(','); 
        // Actually, let's just use split(',') and assume simple data for now as per sample.
        // If the user adds commas in titles, we might need a library or better regex.
        // The sample: `Blues: Bee Bee & the bluebirds`. No commas. 
        
        // Let's stick effectively to split(',') scanning for quotes if needed, 
        // but let's try to be simple first as adding a full parser is verbose.
        // The provided data is very simple.
        const cols = parseLine(line);

        if (cols.length < 3) continue;

        const dateRaw = cols[idx.date];
        const time = cols[idx.time];
        const title = cols[idx.title];
        const entry = cols[idx.entry];
        const tickets = cols[idx.tickets] || '';

        // Parse Date
        let dateObj = new Date();
        if (dateRaw.includes('.')) {
            const parts = dateRaw.split('.');
            // DD.MM.YYYY
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${time || '00:00'}`);
        } else {
             // YYYY-MM-DD
            dateObj = new Date(`${dateRaw}T${time || '00:00'}`);
        }
        
        // Format Date for Display (e.g. "Sat, 24 Jan")
        const dateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
        const dateDisplay = dateObj.toLocaleDateString('en-GB', dateOptions);

        // Determine Status
        let status = 'none';
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
            title: title.replace(/^"|"$/g, ''), // remove quotes if any
            dateObj,
            dateDisplay,
            time,
            entry: entry.replace(/^"|"$/g, ''),
            ticketsUrl,
            status
        });
    }

    // Sort by date
    return events.sort((a, b) => a.dateObj - b.dateObj);
};

// Helper for CSV line parsing with quotes support
const parseLine = (text) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let char of text) {
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
