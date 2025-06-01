import { loadChordDefinitions, ChordDefinition } from './chordFileParser';

let chordDefinitions: ChordDefinition[] = [];

// Load chord definitions when the module is loaded
loadChordDefinitions().then(definitions => {
  chordDefinitions = definitions;
});

// Define basic chord patterns
const chordPatterns = {
  // Major chords (both international and Italian)
  major: [
    // International (C, D, E, F, G, A, B)
    /^[A-G](#|b)?$/,
    // Italian (DO, RE, MI, FA, SOL, LA, SI)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?$/,
  ],
  
  // Minor chords
  minor: [
    // International (e.g., Cm, Dm, Em)
    /^[A-G](#|b)?m$/,
    // Italian (e.g., DOm, REm, MIm)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?m$/,
  ],
  
  // Seventh chords
  seventh: [
    // International (e.g., C7, D7, E7)
    /^[A-G](#|b)?7$/,
    // Italian (e.g., DO7, RE7, MI7)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?7$/,
  ],
  
  // Minor seventh chords
  minorSeventh: [
    // International (e.g., Cm7, Dm7, Em7)
    /^[A-G](#|b)?m7$/,
    // Italian (e.g., DOm7, REm7, MIm7)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?m7$/,
  ],
  
  // Major seventh chords
  majorSeventh: [
    // International (e.g., Cmaj7, Dmaj7, Emaj7)
    /^[A-G](#|b)?(maj7|M7)$/,
    // Italian (e.g., DOmaj7, REmaj7, MImaj7)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?(maj7|M7)$/,
  ],
  
  // Suspended chords
  suspended: [
    // International (e.g., Csus4, Dsus2)
    /^[A-G](#|b)?sus[24]$/,
    // Italian (e.g., DOsus4, REsus2)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?sus[24]$/,
  ],
  
  // Added chords
  added: [
    // International (e.g., Cadd9, Dadd2)
    /^[A-G](#|b)?add[29]$/,
    // Italian (e.g., DOadd9, REadd2)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?add[29]$/,
  ],
  
  // Diminished chords
  diminished: [
    // International (e.g., Cdim, Ddim)
    /^[A-G](#|b)?(dim|°)$/,
    // Italian (e.g., DOdim, REdim)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?(dim|°)$/,
  ],
  
  // Augmented chords
  augmented: [
    // International (e.g., Caug, Daug)
    /^[A-G](#|b)?(aug|\+)$/,
    // Italian (e.g., DOaug, REaug)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?(aug|\+)$/,
  ],
  
  // Complex chords with extended notes or altered bass
  complex: [
    // International (e.g., C9, D11, E13)
    /^[A-G](#|b)?[0-9]+$/,
    // Italian (e.g., DO9, RE11, MI13)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?[0-9]+$/,
    // Altered bass (e.g., C/G, Dm/F)
    /^[A-G](#|b)?(m|dim|aug|maj7|7|sus[24]|add[29])?\/[A-G](#|b)?$/,
    // Italian altered bass (e.g., DO/SOL, REm/FA)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?(m|dim|aug|maj7|7|sus[24]|add[29])?\/[A-G](#|b)?$/,
    // Italian altered bass with Italian bass note (e.g., DO/SOL, REm/FA)
    /^(DO|RE|MI|FA|SOL|LA|SI)(#|b)?(m|dim|aug|maj7|7|sus[24]|add[29])?\/(DO|RE|MI|FA|SOL|LA|SI)(#|b)?$/,
  ],
};

// Map of Italian to international note names
const italianToInternational = {
  'DO': 'C',
  'RE': 'D',
  'MI': 'E',
  'FA': 'F',
  'SOL': 'G',
  'LA': 'A',
  'SI': 'B'
};

// Map of international to Italian note names
const internationalToItalian = {
  'C': 'DO',
  'D': 'RE',
  'E': 'MI',
  'F': 'FA',
  'G': 'SOL',
  'A': 'LA',
  'B': 'SI'
};

// The notes in order for transposing
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const italianNotes = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];

// Function to check if a string is a chord
export const isChord = (word: string): boolean => {
  word = word.trim();
  // First, check against the loaded chord definitions
  if (chordDefinitions.some(def => def.chord_it === word || def.chord_en === word)) {
    return true;
  }
  // Fallback to regex patterns if not found in CSV (optional, or remove if CSV is comprehensive)
  // console.log(`Chord ${word} not found in CSV, checking regex patterns`);
  word = word.trim();
  
  // Check against all patterns
  return Object.values(chordPatterns).some(patterns => 
    patterns.some(pattern => pattern.test(word))
  );
};

// Function to get chord data from definitions
export const getChordData = (chordName: string): ChordDefinition | undefined => {
  return chordDefinitions.find(def => def.chord_it === chordName || def.chord_en === chordName);
};

// Function to parse a note from a chord
const parseNote = (chord: string): { baseNote: string, isItalian: boolean } => {
  chord = chord.trim();
  
  // Check if it's an Italian chord
  for (const italianNote of Object.keys(italianToInternational)) {
    if (chord.startsWith(italianNote)) {
      return { baseNote: italianNote, isItalian: true };
    }
  }
  
  // Otherwise assume it's international
  return { baseNote: chord[0], isItalian: false };
};

// Function to transpose a chord by a number of semitones
export const transposeChord = (chord: string, semitones: number): string => {
  if (!chord || semitones === 0) return chord;
  
  // Parse the chord to get its base note and whether it's Italian or international
  const { baseNote, isItalian } = parseNote(chord);
  
  // If we couldn't identify the base note, return the original chord
  if (!baseNote) return chord;
  
  // Get the proper reference arrays based on notation type
  const noteArray = isItalian ? italianNotes : notes;
  
  // Find the index of the base note in the reference array
  let baseIndex = -1;
  for (let i = 0; i < noteArray.length; i++) {
    if (chord.startsWith(noteArray[i])) {
      baseIndex = i;
      break;
    }
  }
  
  // If we couldn't find the base note in our reference arrays, return the original chord
  if (baseIndex === -1) return chord;
  
  // Calculate the new note index
  const newIndex = (baseIndex + semitones + noteArray.length) % noteArray.length;
  
  // Get the new note
  const newNote = noteArray[newIndex];
  
  // Replace the base note in the original chord with the new note
  const noteToReplace = noteArray[baseIndex];
  return chord.replace(noteToReplace, newNote);
};

// Function to identify chords in a line and return them with their positions
export const identifyChords = (line: string): Array<{ chord: string, index: number }> => {
  const words = line.split(/\s+/);
  const chords: Array<{ chord: string, index: number }> = [];
  
  let currentIndex = 0;
  for (const word of words) {
    if (isChord(word)) {
      chords.push({ chord: word, index: currentIndex });
    }
    currentIndex += word.length + 1; // +1 for the space
  }
  
  return chords;
};

// Function to transpose a line of chords
export const transposeLine = (line: string, semitones: number): string => {
  if (!line || semitones === 0) return line;
  
  const words = line.split(/(\s+)/);
  return words.map(word => {
    if (word.trim() && isChord(word.trim())) {
      return transposeChord(word, semitones);
    }
    return word;
  }).join('');
};
