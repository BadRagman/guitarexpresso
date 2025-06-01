
import { useState, useEffect, useRef } from "react";
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
  scroll_speed?: number; // Added scroll_speed
}

const ViewSong = () => {
  const { songId } = useParams<{ songId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [transposedSemitones, setTransposedSemitones] = useState(0);
  const [capo, setCapo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50); // Initial scroll speed in pixels per second
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollIntervalRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
          setScrollSpeed(data.scroll_speed || 50); // Set scroll_speed from data or default
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
        setScrollSpeed(foundSong.scroll_speed || 50); // Set scroll_speed from localStorage or default
      }
    }
  }, [songId, user]);
  
  const handleTranspose = (semitones: number) => {
    setTransposedSemitones(semitones);
    saveSongSettings(semitones, capo, scrollSpeed);
  };
  
  const handleCapoChange = (value: string) => {
    const capoValue = parseInt(value, 10);
    setCapo(capoValue);
    saveSongSettings(transposedSemitones, capoValue, scrollSpeed);
  };

  const handleScrollSpeedChange = (value: string) => { 
    const newSpeed = parseInt(value, 10);
    setScrollSpeed(newSpeed);
    saveSongSettings(transposedSemitones, capo, newSpeed); // Save on speed change
    if (isAutoScrolling) {
      startAutoScroll(); // Restart autoscroll with new speed
    }
  };

  const increaseScrollSpeed = () => {
    const newSpeed = Math.min(200, scrollSpeed + 1);
    setScrollSpeed(newSpeed);
    saveSongSettings(transposedSemitones, capo, newSpeed); // Save on speed change
    if (isAutoScrolling) startAutoScroll();
  };

  const decreaseScrollSpeed = () => {
    const newSpeed = Math.max(1, scrollSpeed - 1);
    setScrollSpeed(newSpeed);
    saveSongSettings(transposedSemitones, capo, newSpeed); // Save on speed change
    if (isAutoScrolling) startAutoScroll();
  };
  
  const saveSongSettings = (semitones: number, capoValue: number, currentScrollSpeed: number) => {
    if (!song || !songId) return;
    
    if (user && !songId.startsWith('song-')) {
      // Save to Supabase
      updateSettingsMutation.mutate({
        id: song.id,
        updates: {
          transposed_semitones: semitones,
          capo: capoValue,
          scroll_speed: currentScrollSpeed // Save scroll_speed
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
            capo: capoValue,
            scroll_speed: currentScrollSpeed // Save scroll_speed
          };
        }
        return s;
      });
      
      localStorage.setItem("songs", JSON.stringify(updatedSongs));
    }
  };
  
  const handlePlayPause = () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  const handleStop = () => {
    stopAutoScroll();
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const handleRewind = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Optionally, if rewind should also stop scrolling:
    // stopAutoScroll(); 
  };

  const startAutoScroll = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    setIsAutoScrolling(true);
    scrollIntervalRef.current = window.setInterval(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop += 1; // Scroll 1 pixel at a time
        // Stop if scrolled to bottom
        if (contentRef.current.scrollTop + contentRef.current.clientHeight >= contentRef.current.scrollHeight) {
          stopAutoScroll();
        }
      }
    }, 1000 / scrollSpeed); // Adjust interval based on scrollSpeed (pixels per second)
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsAutoScrolling(false);
    setIsPlaying(false); // Update play button state for UI consistency
  };
  
  // Save settings when navigating away
  useEffect(() => {
    return () => {
      if (song && songId) {
        saveSongSettings(transposedSemitones, capo, scrollSpeed); // Pass scrollSpeed
      }
      stopAutoScroll(); // Clean up scroll interval on component unmount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, songId, transposedSemitones, capo, scrollSpeed]); // Added scrollSpeed to dependencies
  
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
    // Ensure enough padding at the bottom of the main div to not be overlapped by fixed controls
    <div className="min-h-screen flex flex-col relative pb-32 sm:pb-24"> 
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">

          
          {/* Edit and MySongs Links */}
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
          
          {/* Transpose and Capo Controls (remain in main content, not part of fixed scroll controls) */}
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
                  disabled
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
          {/* Card's bottom margin will interact with the main div's padding bottom for spacing */}
          <Card className="mb-4">
            <CardContent ref={contentRef} className="mt-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}> 
              <ChordDisplay songData={song} transposedSemitones={transposedSemitones} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed Scroll Controls Bar - Transparent Background */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 z-50">
        <div className="max-w-3xl mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 rounded-lg shadow-xl flex flex-col sm:flex-row items-center justify-around space-y-3 sm:space-y-0 sm:space-x-2">
          
          {/* Scroll Control Buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              className="rounded-full h-12 w-12 sm:h-14 sm:w-14 border-2 border-blue-500"
              onClick={handleRewind} 
            >
              ◀
            </Button>
            <Button 
              className="rounded-full h-16 w-16 sm:h-20 sm:w-20 bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
              onClick={handlePlayPause} 
            >
              <span className="text-2xl sm:text-3xl">{isAutoScrolling ? '⏸' : '▶'}</span>
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full h-12 w-12 sm:h-14 sm:w-14 border-2 border-blue-500"
              onClick={handleStop} 
            >
              ■
            </Button>
          </div>
          
          {/* Scroll Speed Controls (using +/- buttons and displaying current speed) */}
          <div className="flex flex-col items-center space-y-1">
            <span className="text-xs font-medium">SPEED</span>
            <div className="flex items-center space-x-1">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-400 h-8 w-8"
                onClick={decreaseScrollSpeed}
              >
                -
              </Button>
              <span className="w-10 text-center text-sm p-1 border border-gray-300 rounded-md bg-white/50 dark:bg-black/30">{scrollSpeed}</span>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-400 h-8 w-8"
                onClick={increaseScrollSpeed}
              >
                +
              </Button>
            </div>
            {/* Slider for speed */}
            <input
              type="range"
              min="1" // Min speed 1
              max="200" // Max speed 200
              value={scrollSpeed}
              onChange={(e) => handleScrollSpeedChange(e.target.value)}
              className="w-32 mt-1 accent-blue-500"
            />
          </div>

          {/* Logout Button (can be part of this bar or separate) */}
          {user && (
            <div className="absolute right-4 top-[-40px] sm:static sm:top-auto sm:right-auto">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  navigate('/');
                  toast.success("Logged out successfully");
                }}
              >
                <LogOut className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSong;
