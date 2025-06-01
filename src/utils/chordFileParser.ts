// src/utils/chordFileParser.ts

export interface ChordDefinition {
  chord_it: string;
  chord_en: string;
  type: string;
  fingering: string;
  alternative_fingerings: string[];
  diagram_url?: string; 
}

export const parseChordCsv = async (csvContent: string): Promise<ChordDefinition[]> => {
  const lines = csvContent.split('\n');
  const chords: ChordDefinition[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Split by comma, but handle commas within quotes for alternative_fingerings
      const parts = line.match(/("[^"]+"|[^,]+)/g);
      if (parts && parts.length >= 5) {
        const alternativeFingeringsRaw = parts[4].replace(/"/g, ''); // Remove quotes
        chords.push({
          chord_it: parts[0],
          chord_en: parts[1],
          type: parts[2],
          fingering: parts[3],
          alternative_fingerings: alternativeFingeringsRaw ? alternativeFingeringsRaw.split(',').map(s => s.trim()) : [],
          diagram_url: parts[5] ? parts[5].replace(/"/g, '') : undefined,
        });
      }
    }
  }
  return chords;
};

// Function to fetch and parse the Chords.csv file from the public folder
export const loadChordDefinitions = async (): Promise<ChordDefinition[]> => {
  try {
    const response = await fetch('/Chords.csv'); // Assumes Chords.csv is in the public folder
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseChordCsv(csvText);
  } catch (error) {
    console.error("Error loading chord definitions:", error);
    return []; // Return empty array on error
  }
};