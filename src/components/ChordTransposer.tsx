
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChordTransposerProps {
  onTranspose: (semitones: number) => void;
  currentTransposition: number;
}

const ChordTransposer: React.FC<ChordTransposerProps> = ({
  onTranspose,
  currentTransposition
}) => {
  // Create options for semitones from -11 to +11
  const semitoneOptions = Array.from({ length: 23 }, (_, i) => i - 11);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="flex-grow">
            <Label htmlFor="transpose">Trasposizione</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Select
                value={currentTransposition.toString()}
                onValueChange={(value) => onTranspose(parseInt(value, 10))}
              >
                <SelectTrigger id="transpose" className="w-full">
                  <SelectValue placeholder="Seleziona tonalità" />
                </SelectTrigger>
                <SelectContent>
                  {semitoneOptions.map((semitone) => (
                    <SelectItem key={semitone} value={semitone.toString()}>
                      {semitone > 0 
                        ? `+${semitone} semitoni` 
                        : semitone < 0 
                          ? `${semitone} semitoni` 
                          : "Tonalità originale"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onTranspose(currentTransposition - 1)}
              disabled={currentTransposition <= -11}
            >
              -1
            </Button>
            <Button 
              size="sm" 
              onClick={() => onTranspose(0)}
              variant={currentTransposition === 0 ? "default" : "outline"}
            >
              Reset
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onTranspose(currentTransposition + 1)}
              disabled={currentTransposition >= 11}
            >
              +1
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChordTransposer;
