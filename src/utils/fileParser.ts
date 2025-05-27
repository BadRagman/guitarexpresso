// File import and parsing utilities
import { toast } from "sonner";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Define PDF.js TextItem interface since it's not directly exported
interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
  fontName?: string;
}

// Configure PDF.js worker - using a dynamic import wrapped in a function to avoid top-level await
const configurePdfWorker = () => {
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
};

// Initialize PDF worker configuration
configurePdfWorker();

export interface SongData {
  title: string;
  artist: string;
  bpm: string;
  content: string;
  lines: { isChordLine: boolean, content: string, tag?: string }[];
}

/**
 * Parses the content of a text file
 */
export const parseTextContent = (content: string): SongData => {
  const lines = content.split('\n').map(line => line.trimEnd());
  
  // Try to extract title, artist, and bpm from the beginning
  let title = "Untitled";
  let artist = "Unknown";
  let bpm = "120";
  
  let contentStartIndex = 0;
  
  // Check if first line is likely the title (e.g., no chords, relatively short)
  if (lines.length > 0 && lines[0].trim().length > 0 && lines[0].length < 50 && !lines[0].includes(':')) {
    title = lines[0].trim();
    contentStartIndex = 1;
    
    // Check if second line is likely the artist
    if (lines.length > 1 && lines[1].trim().length > 0 && lines[1].length < 50) {
      artist = lines[1].trim();
      contentStartIndex = 2;
      
      // Check if third line contains BPM information
      if (lines.length > 2 && /bpm|tempo/i.test(lines[2])) {
        const bpmMatch = lines[2].match(/\d+/);
        if (bpmMatch) {
          bpm = bpmMatch[0];
        }
        contentStartIndex = 3;
      }
    }
  }
  
  // Process the remaining content for chord and lyric lines
  const processedLines = lines.slice(contentStartIndex)
    .filter(line => line.trim().length > 0)
    .map(line => {
      // Process each line to determine if it's a chord line or lyric line
      const processedLine = processLine(line);
      return processedLine;
    });
  
  return {
    title,
    artist,
    bpm,
    content: lines.slice(contentStartIndex).join('\n'),
    lines: processedLines
  };
};

/**
 * Parses a text/txt file
 */
export const parseTxtFile = async (file: File): Promise<SongData> => {
  try {
    const content = await file.text();
    return parseTextContent(content);
  } catch (error) {
    console.error("Error parsing TXT file:", error);
    toast.error("Error parsing text file");
    throw error;
  }
};

/**
 * Parse a DOCX file using mammoth.js
 */
export const parseDocxFile = async (file: File): Promise<SongData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const textContent = result.value;
    
    // Use the same parsing logic as text files
    return parseTextContent(textContent);
  } catch (error) {
    console.error("Error parsing DOCX file:", error);
    toast.error("Errore durante il parsing del file DOCX");
    
    // Return a placeholder with error message
    return {
      title: file.name.replace('.docx', ''),
      artist: "Unknown",
      bpm: "120",
      content: "Errore durante il parsing del file DOCX.",
      lines: [
        { isChordLine: false, content: "Errore durante il parsing del file DOCX." }
      ]
    };
  }
};

/**
 * Parse a PDF file using pdf.js
 */
export const parsePdfFile = async (file: File): Promise<SongData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    console.log("Starting PDF parsing...");
    
    // Add robust options for PDF loading
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
      cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
      cMapPacked: true,
    });
    
    // Load the PDF document with improved error handling
    const pdf = await loadingTask.promise.catch(error => {
      console.error("Error loading PDF document:", error);
      throw new Error(`Error loading PDF: ${error.message}`);
    });
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    const numPages = pdf.numPages;
    let fullText = '';
    
    // Extract text from each page with improved formatting preservation
    for (let i = 1; i <= numPages; i++) {
      console.log(`Processing page ${i}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let lastY = null;
      let currentLine = '';
      
      // Process each text item with position awareness to preserve line breaks
      for (const item of textContent.items) {
        const textItem = item as TextItem; // Use our custom interface
        
        // If this is a new line (different Y position or significantly different X position)
        if (lastY !== null && (Math.abs(textItem.transform[5] - lastY) > 1)) {
          fullText += currentLine.trim() + '\n';
          currentLine = textItem.str;
        } else if (currentLine && textItem.str && textItem.transform[4] - (currentLine.length * 5) > 10) {
          // If there seems to be a significant horizontal gap, add extra space
          currentLine += '   ' + textItem.str;
        } else {
          // Continue on the same line
          currentLine += textItem.str;
        }
        
        lastY = textItem.transform[5];
      }
      
      // Add the final line
      if (currentLine.trim()) {
        fullText += currentLine.trim() + '\n';
      }
      
      // Add page break between pages
      if (i < numPages) {
        fullText += '\n';
      }
    }
    
    console.log("PDF parsing completed successfully");
    
    // Enhanced chord detection by analyzing spacing patterns
    const lines = fullText.split('\n');
    const processedLines = lines.map((line, index) => {
      // Look for patterns common in chord lines (like having multiple short words with spaces between)
      const words = line.trim().split(/\s+/);
      const avgWordLength = line.trim().length / (words.length || 1);
      const hasChordPatterns = /[A-G](b|#)?(m|maj|dim|aug|sus[24]|7|maj7|m7|6|9)/.test(line) || 
                             /(do|re|mi|fa|sol|la|si)(b|#)?(m|maj|dim|aug|sus[24]|7|maj7|m7|6|9)/i.test(line);
      
      // A chord line typically has shorter average word length and specific patterns
      const isLikelyChordLine = (avgWordLength < 3 && words.length > 1 && hasChordPatterns) ||
                              (hasChordPatterns && line.length < 30 && line.includes(' '));
      
      return {
        isChordLine: isLikelyChordLine,
        content: line.trim()
      };
    });
    
    // Extract title, artist, and bpm information
    let title = file.name.replace('.pdf', '');
    let artist = "Unknown";
    let bpm = "120";
    
    // Try to find the title and artist from the beginning of the content
    if (processedLines.length > 0 && processedLines[0].content.length > 0 && processedLines[0].content.length < 50) {
      title = processedLines[0].content;
      
      if (processedLines.length > 1 && processedLines[1].content.length < 50) {
        artist = processedLines[1].content;
      }
    }
    
    return {
      title,
      artist,
      bpm,
      content: fullText,
      lines: processedLines.filter(line => line.content.trim().length > 0)
    };
    
  } catch (error) {
    console.error("Error parsing PDF file:", error);
    toast.error("Errore durante il parsing del file PDF");
    
    // Return a placeholder with error message
    return {
      title: file.name.replace('.pdf', ''),
      artist: "Unknown",
      bpm: "120",
      content: "Errore durante il parsing del file PDF.",
      lines: [
        { isChordLine: false, content: "Errore durante il parsing del file PDF." }
      ]
    };
  }
};

/**
 * Processes a line and identifies if it's a chord line or lyric line
 */
export const processLine = (line: string): { isChordLine: boolean, content: string, tag?: string } => {
  const normalizedLine = line.trim();
  
  // Handle explicit tags
  if (normalizedLine.startsWith('[CHORDS]')) {
    return {
      isChordLine: true,
      content: normalizedLine.substring(8).trim(),
      tag: 'CHORDS'
    };
  }
  
  if (normalizedLine.startsWith('[LYRICS]')) {
    return {
      isChordLine: false,
      content: normalizedLine.substring(8).trim(),
      tag: 'LYRICS'
    };
  }
  
  // Basic chord patterns (both international and Italian notation)
  const chordPatterns = [
    /[A-G](b|#)?(m|maj|dim|aug|sus[24]|7|maj7|m7|6|9|11|13)?/g,  // International notation
    /\b(do|re|mi|fa|sol|la|si)(b|#)?(m|maj|dim|aug|sus[24]|7|maj7|m7|6|9|11|13)?\b/gi,  // Italian notation
    /\[(do|re|mi|fa|sol|la|si|[A-G])(b|#)?(m|maj|dim|aug|sus[24]|7|maj7|m7|6|9|11|13)?\]/gi  // Bracketed notation
  ];
  
  // Check if this line is mostly chords
  let chordMatches = 0;
  let chordCharacters = 0;
  
  for (const pattern of chordPatterns) {
    const matches = Array.from(normalizedLine.matchAll(pattern));
    chordMatches += matches.length;
    chordCharacters += matches.reduce((sum, match) => sum + match[0].length, 0);
  }
  
  // If there are chord matches and they make up a significant portion of the line
  // or if the line is short and contains chords
  const isChordLine = (
    (chordMatches > 1 && chordCharacters / normalizedLine.length > 0.3) || // 30% of line is chords
    (chordMatches > 0 && normalizedLine.length < 20 && /^[\s\[\]A-Ga-g#bdoremifasollasi]+$/.test(normalizedLine))
  );
  
  return {
    isChordLine,
    content: normalizedLine
  };
};

/**
 * Parse an uploaded file based on its type
 */
export const parseFile = async (file: File): Promise<SongData> => {
  const fileType = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileType) {
    case 'txt':
      return parseTxtFile(file);
    case 'docx':
      return parseDocxFile(file);
    case 'pdf':
      return parsePdfFile(file);
    default:
      toast.error("Formato di file non supportato. Utilizzare .txt, .docx, o .pdf");
      throw new Error("Unsupported file type");
  }
};
