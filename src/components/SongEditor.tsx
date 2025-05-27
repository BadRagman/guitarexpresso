
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { processLine } from "@/utils/fileParser";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { File, Music } from "lucide-react";

interface SongEditorProps {
  title: string;
  artist: string;
  bpm: string;
  content: string;
  onSave: (title: string, artist: string, bpm: string, lines: { isChordLine: boolean, content: string, tag?: string }[]) => void;
}

const SongEditor: React.FC<SongEditorProps> = ({
  title: initialTitle,
  artist: initialArtist,
  bpm: initialBpm,
  content: initialContent,
  onSave,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);
  const [bpm, setBpm] = useState(initialBpm);
  const [content, setContent] = useState(initialContent);
  const [lines, setLines] = useState<Array<{ content: string, isChordLine: boolean, tag?: string }>>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Process content into lines on initial load and when content changes
  useEffect(() => {
    const currentTextLines = content.split('\n');
    const newProcessedLines = currentTextLines.map((lineText, idx) => {
      // Try to preserve existing type if line content hasn't changed or if it's a new line
      // and the number of lines in `lines` state is consistent with `currentTextLines`
      const existingLine = lines[idx];
      if (existingLine && existingLine.content === lineText && lines.length === currentTextLines.length) {
        return existingLine; // Preserve type if content is identical and line count matches
      }
      const processed = processLine(lineText); // processLine determines initial type
      return { content: lineText, isChordLine: processed.isChordLine, tag: processed.tag };
    });
    setLines(newProcessedLines);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]); // Riprocessa solo se il contenuto grezzo della textarea cambia

  const getCursorLineIndex = () => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textUpToCursor = textareaRef.current.value.substring(0, cursorPosition);
      return textUpToCursor.split('\n').length - 1;
    }
    return -1;
  };

  const setLineTypeAtCursor = (isChord: boolean) => {
    const lineIndex = getCursorLineIndex();
    if (lineIndex !== -1 && lines[lineIndex]) {
      const newLines = [...lines];
      newLines[lineIndex] = {
        ...newLines[lineIndex],
        isChordLine: isChord,
        tag: isChord ? 'CHORDS' : 'LYRICS',
      };
      setLines(newLines);
      toast.info(`Riga ${lineIndex + 1} impostata come ${isChord ? 'Accordi' : 'Testo'}`);
    } else {
      toast.warn("Non è stato possibile determinare la riga corrente o la riga non esiste.");
    }
  };

  // This function is kept for potential future use or if there's another way to target lines.
  // For now, the global buttons use setLineTypeAtCursor.
  const toggleLineType = (index: number) => {
    const newLines = [...lines];
    if(newLines[index]){
      newLines[index] = {
        ...newLines[index],
        isChordLine: !newLines[index].isChordLine,
        tag: !newLines[index].isChordLine ? 'CHORDS' : 'LYRICS'
      };
      setLines(newLines);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Il titolo non può essere vuoto");
      return;
    }

    onSave(title, artist, bpm, lines);
    toast.success("Modifiche salvate con successo!");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSave();
  };

  return (
    <form onSubmit={handleSubmit} id="song-editor-form">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Modifica Canzone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titolo della canzone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artista</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Nome dell'artista"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bpm">BPM</Label>
            <Input
              id="bpm"
              value={bpm}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^[0-9]+$/.test(value)) {
                  setBpm(value);
                }
              }}
              placeholder="Battiti al minuto"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">Testo e Accordi</Label>
          <div className="text-xs text-muted-foreground mb-1">
            Scrivi o incolla il testo e gli accordi qui. Posiziona il cursore sulla riga desiderata e usa i pulsanti sotto per definirne il tipo.
          </div>
          <Textarea
            id="content"
            ref={textareaRef} // Ref per tracciare la posizione del cursore
            value={content}
            onChange={(e) => setContent(e.target.value)} // Aggiorna lo stato 'content' direttamente
            placeholder="Incolla o scrivi qui il testo e gli accordi della canzone..."
            className="font-mono min-h-[300px] w-full"
          />
          <div className="flex justify-start gap-2 mt-2">
            <Button type="button" onClick={() => setLineTypeAtCursor(true)} variant="outline" size="sm">
              <Music className="h-4 w-4 mr-2" /> Imposta Riga Corrente come Accordi
            </Button>
            <Button type="button" onClick={() => setLineTypeAtCursor(false)} variant="outline" size="sm">
              <File className="h-4 w-4 mr-2" /> Imposta Riga Corrente come Testo
            </Button>
          </div>
        </div>
        
        {/* Anteprima opzionale dei tipi di riga */} 
        {lines.length > 0 && (
          <div className="space-y-2 mt-6 pt-4 border-t">
            <Label>Anteprima Tipi di Riga (Non Editabile Direttamente Qui)</Label>
            <div className="text-xs text-muted-foreground mb-3">
              Questa è una visualizzazione di come le righe sono attualmente interpretate in base al testo sopra e alle tue selezioni.
            </div>
            <div className="space-y-1 border rounded-md p-4 max-h-[200px] overflow-y-auto bg-muted/30">
              {lines.map((line, index) => (
                <div key={index} 
                     className={`flex items-center p-1.5 rounded-sm text-sm transition-colors duration-150 ease-in-out 
                                 ${line.isChordLine ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-400'}`}>
                  <span className={`mr-3 w-20 flex-shrink-0 text-right pr-3 font-medium 
                                   ${line.isChordLine ? 'text-blue-700' : 'text-gray-600'}`}>
                    {line.isChordLine ? "Accordi" : "Testo"}
                  </span>
                  <span 
                    className={`flex-grow ${line.isChordLine ? "font-mono text-blue-800" : "text-gray-800"}`}
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                  >
                    {line.content.trim() === '' ? <span className="italic text-gray-400">[Riga Vuota]</span> : line.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        </CardContent>
        {/* The save button is now in EditSong.tsx */}
      </Card>
    </form>
  );
};

export default SongEditor;
