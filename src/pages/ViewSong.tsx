
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ChordDisplay from "@/components/ChordDisplay";
import { SongData } from "@/utils/fileParser";
import { ArrowLeft, Pencil, Music, LogOut } from "lucide-react";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { SongService } from "@/services/SongService";
import { useQuery, useMutation } from "@tanstack/react-query";

interface Song extends SongData {
  id: string;
  transposed_semitones?: number;
  capo?: number;
}

const ViewSong = () => {
  const { songId } = useParams<{ songId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [transposedSemitones, setTransposedSemitones] = useState(0);
  const [capo, setCapo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(2);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Fetch song from Supabase
  const { data: supabaseSong, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['view-song', songId],
    queryFn: () => SongService.fetchSong(songId!),
    enabled: !!user && !!songId && !songId.startsWith('song-'),
    meta: {
      onSuccess: (data: any) => {
        if (data) {
          setSong(data);
          setTransposedSemitones(data.transposed_semitones || 0);
          setCapo(data.capo || 0);
        }
      },
      onError: () => {
        toast.error("Errore nel caricare la canzone");
      }
    }
  });
  
  // Update song settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: { id: string, updates: Partial<Song> }) => 
      SongService.updateSong(data.id, data.updates),
    onSuccess: () => {
      // Silent success
    }
  });
  
  useEffect(() => {
    if (songId && (!user || songId.startsWith('song-'))) {
      // Fetch from localStorage if not logged in
      const songs = JSON.parse(localStorage.getItem("songs") || "[]");
      const foundSong = songs.find((s: Song) => s.id === songId);
      if (foundSong) {
        setSong(foundSong);
        // Set transposed semitones and capo from saved settings if available
        setTransposedSemitones(foundSong.transposed_semitones || 0);
        setCapo(foundSong.capo || 0);
      }
    }
  }, [songId, user]);
  
  const handleTranspose = (semitones: number) => {
    setTransposedSemitones(semitones);
    saveSongSettings(semitones, capo);
  };
  
  const handleCapoChange = (value: string) => {
    const capoValue = parseInt(value, 10);
    setCapo(capoValue);
    saveSongSettings(transposedSemitones, capoValue);
  };
  
  const saveSongSettings = (semitones: number, capoValue: number) => {
    if (!song || !songId) return;
    
    if (user && !songId.startsWith('song-')) {
      // Save to Supabase
      updateSettingsMutation.mutate({
        id: song.id,
        updates: {
          transposed_semitones: semitones,
          capo: capoValue
        }
      });
    } else {
      // Save to localStorage
      const songs = JSON.parse(localStorage.getItem("songs") || "[]");
      const updatedSongs = songs.map((s: Song) => {
        if (s.id === songId) {
          return {
            ...s,
            transposed_semitones: semitones,
            capo: capoValue
          };
        }
        return s;
      });
      
      localStorage.setItem("songs", JSON.stringify(updatedSongs));
    }
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleTempoChange = (value: number) => {
    setTempo(value);
  };
  
  // Save settings when navigating away
  useEffect(() => {
    return () => {
      if (song && songId) {
        saveSongSettings(transposedSemitones, capo);
      }
    };
  }, []);
  
  if (isLoadingSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }
  
  if (!song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Song not found</h1>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* <div className="text-center mb-6">
            <h1 className="text-4xl font-bold">{song.title}</h1>
            <p className="text-xl text-gray-600">{song.artist}</p>
          </div> */}
          
          <div className="flex justify-end space-x-2 mb-4">
            <Link to={`/edit/${songId}`}>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Link to="/my-songs">
              <Button className="bg-blue-500 hover:bg-blue-600">
                My songs
              </Button>
            </Link>
          </div>
          
          {/* Transpose and Capo Controls */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Traspose</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-400 h-10 w-10"
                  onClick={() => handleTranspose(transposedSemitones - 1)}
                >
                  -
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-400 h-10"
                >
                  {transposedSemitones > 0 ? `+${transposedSemitones}` : transposedSemitones}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-400 h-10 w-10"
                  onClick={() => handleTranspose(transposedSemitones + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">CAPO</h3>
              <Select value={capo.toString()} onValueChange={handleCapoChange}>
                <SelectTrigger className="border-2 border-gray-400">
                  <SelectValue placeholder="Select capo position" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? "No capo" : `Capo ${i}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Song Content */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <ChordDisplay 
                songData={song} 
                transposedSemitones={transposedSemitones}
              />
            </CardContent>
          </Card>
          
          {/* Playback Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="rounded-full h-16 w-16 border-2 border-blue-500"
                onClick={() => toast.info("Previous section feature coming soon!")}
              >
                ◀
              </Button>
              <Button 
                className="rounded-full h-24 w-24 bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
                onClick={togglePlay}
              >
                <span className="text-3xl">{isPlaying ? '⏸' : '▶'}</span>
              </Button>
              <Button 
                variant="outline" 
                className="rounded-full h-16 w-16 border-2 border-blue-500"
                onClick={() => toast.info("Next section feature coming soon!")}
              >
                ■
              </Button>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-400 h-10 w-10"
                  onClick={() => handleTempoChange(Math.max(1, tempo - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center">{tempo}</span>
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-400 h-10 w-10"
                  onClick={() => handleTempoChange(Math.min(20, tempo + 1))}
                >
                  +
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={tempo}
                onChange={(e) => handleTempoChange(parseInt(e.target.value))}
                className="w-40 mt-2"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewSong;
