
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SongData } from "@/utils/fileParser";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Music, FileWarning, AlertTriangle } from "lucide-react";
import { transposeLine, getChordData } from "@/utils/chordParser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Assuming you have a Tooltip component

interface ChordDisplayProps {
  songData: SongData;
  transposedSemitones?: number;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({ 
  songData, 
  transposedSemitones = 0 
}) => {
  const isMobile = useIsMobile();
  
  // Check if we're displaying an error message
  const isError = songData.lines.length === 1 && 
    (songData.lines[0].content.includes("Errore durante il parsing") ||
     songData.content.includes("Errore durante il parsing"));
     
  // Identifica se l'errore è specifico per i PDF
  const isPdfError = isError && songData.lines[0].content.includes("PDF");

  // Process the lines to transpose chords if needed
  const processedLines = songData.lines.map(line => {
    if (line.isChordLine && transposedSemitones !== 0) {
      return {
        ...line,
        content: transposeLine(line.content, transposedSemitones)
      };
    }
    return line;
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-2xl font-bold">
          {songData.title}
        </CardTitle>
        <div className="text-sm text-gray-500">
          {songData.artist}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          BPM: {songData.bpm}
          {transposedSemitones !== 0 && (
            <span className="ml-2 text-primary">
              {transposedSemitones > 0 ? `+${transposedSemitones}` : transposedSemitones} semitoni
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className={`${isMobile ? 'px-2' : 'px-6'} py-4 font-mono`}>
        {isError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Errore di Parsing</AlertTitle>
            <AlertDescription>
              {isPdfError ? (
                <>
                  Si è verificato un errore durante l'elaborazione del file PDF.
                  <div className="mt-2 text-xs">
                    Prova le seguenti soluzioni:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Utilizzare un formato diverso (TXT o DOCX)</li>
                      <li>Verificare che il PDF sia accessibile e non protetto</li>
                      <li>Utilizzare un PDF con testo selezionabile (non scansionato)</li>
                    </ul>
                  </div>
                </>
              ) : (
                "Si è verificato un errore durante l'elaborazione del file. Prova con un formato di file diverso o verifica che il file sia formattato correttamente."
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="whitespace-pre-wrap">
            {processedLines.map((line, index) => {
              if (line.isChordLine) {
                return (
                  <div key={`chord-${index}`} className="chord-line flex items-center gap-2">
                    {line.tag && (
                      <Badge variant="outline" className="text-xs h-5">
                        {line.tag}
                      </Badge>
                    )}
                    <span className="text-primary font-semibold">
                      {line.content.split(/(\s+)/).map((segment, segmentIndex) => {
                        if (segment.match(/^\s+$/)) { // If the segment is purely whitespace
                          return <span key={`space-${segmentIndex}`}>{segment}</span>;
                        }
                        const chordData = getChordData(segment.trim());
                        if (chordData) {
                          return (
                            <TooltipProvider key={`chord-segment-${segmentIndex}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-pointer hover:underline">{segment}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p><strong>{chordData.chord_it} / {chordData.chord_en}</strong></p>
                                  <p>Diteggiatura: {chordData.fingering}</p>
                                  {chordData.alternative_fingerings && chordData.alternative_fingerings.length > 0 && (
                                    <p>Alternative: {chordData.alternative_fingerings.join(', ')}</p>
                                  )}
                                  {chordData.diagram_url && 
                                    <img src={chordData.diagram_url} alt={`${chordData.chord_en} diagram`} className="w-32 h-auto mt-2" />
                                  }
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        } else if (segment.trim().length > 0) { // Render non-chord, non-empty segments as text
                            return <span key={`text-segment-${segmentIndex}`}>{segment}</span>;
                        }
                        return null; // Ignore empty segments that are not whitespace
                      })}
                    </span>
                  </div>
                );
              } else {
                return (
                  <div key={`lyric-${index}`} className="lyric-line flex items-center gap-2">
                    {line.tag && (
                      <Badge variant="outline" className="text-xs h-5">
                        {line.tag}
                      </Badge>
                    )}
                    <span>{line.content}</span>
                  </div>
                );
              }
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChordDisplay;
