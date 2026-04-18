// Whisky list fetcher from Google Sheets CSV

const WHISKY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmWgPgr7WQ-f5RGrZwraNzW_COxCXLSQKPjkF6SSf8st4b-UNX323K394ZjRA12oBiVWY5vthddgj9/pub?gid=0&single=true&output=csv";

export interface WhiskyItem {
  name: string;
  category: string;
  price: string;
}

export async function fetchWhiskyList(): Promise<WhiskyItem[]> {
  try {
    const response = await fetch(WHISKY_CSV_URL, {
      next: { revalidate: 3600 },
    });
    const text = await response.text();
    return parseWhiskyCSV(text);
  } catch (error) {
    console.error("Failed to fetch whisky list:", error);
    return [];
  }
}

function parseWhiskyCSV(text: string): WhiskyItem[] {
  const lines = text.trim().split("\n");
  const whiskies: WhiskyItem[] = [];

  // Skip header row (line 0: "Name,Category,Price")
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, "").trim();
    if (!line) continue;

    // Split on comma
    const parts = line.split(",");
    const name = parts[0]?.trim();
    const category = parts[1]?.trim();
    const price = parts[2]?.trim();

    // Stop when we hit the "Non Whisky Products" section
    if (name === "Non Whisky Products") break;

    // Skip empty rows
    if (!name || !category || name === "") continue;

    whiskies.push({ name, category, price: price || "" });
  }

  // Sort alphabetically by name
  whiskies.sort((a, b) => a.name.localeCompare(b.name));

  return whiskies;
}

export async function fetchDrinksList(): Promise<WhiskyItem[]> {
  try {
    const response = await fetch(WHISKY_CSV_URL, {
      next: { revalidate: 3600 },
    });
    const text = await response.text();
    return parseDrinksCSV(text);
  } catch (error) {
    console.error("Failed to fetch drinks list:", error);
    return [];
  }
}

function parseDrinksCSV(text: string): WhiskyItem[] {
  const lines = text.trim().split("\n");
  const drinks: WhiskyItem[] = [];
  let foundDrinksSection = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, "").trim();
    if (!line) continue;

    const parts = line.split(",");
    const name = parts[0]?.trim();
    const category = parts[1]?.trim();
    const price = parts[2]?.trim();

    if (name === "Non Whisky Products") {
      foundDrinksSection = true;
      continue;
    }

    if (!foundDrinksSection) continue;
    
    // Once in the drinks section, push every valid line (don't alphabetize it as requested)
    if (!name || !category || name === "") continue;

    drinks.push({ name, category, price: price || "" });
  }

  return drinks;
}
