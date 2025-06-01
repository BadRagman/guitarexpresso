
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SongEditor from "@/components/SongEditor";
import { SongData } from "@/utils/fileParser";
import { toast } from "sonner";
import { SongService } from "@/services/SongService";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Song extends SongData {
  id: string;
}

const EditSong = () => {
  const { songId } = useParams<{ songId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch song from Supabase if user is logged in
  const { data: supabaseSong, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['song', songId],
    queryFn: () => SongService.fetchSong(songId!),
    enabled: !!user && !!songId && !songId.startsWith('song-'),
    meta: {
      onSuccess: (data: any) => {
        if (data) setSong(data);
      },
      onError: () => {
        toast.error("Errore nel caricare la canzone");
      }
    }
  });
  
  // Update song mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string, updates: Partial<Song> }) => 
      SongService.updateSong(data.id, data.updates),
    onSuccess: () => {
      toast.success("Modifiche salvate con successo!");
      navigate(`/view/${songId}`);
    },
    onError: () => {
      toast.error("Errore nel salvare le modifiche");
    }
  });
  
  useEffect(() => {
    if (songId && (!user || songId.startsWith('song-'))) {
      // Fetch from localStorage if not logged in or if it's a local song
      const songs = JSON.parse(localStorage.getItem("songs") || "[]");
      const foundSong = songs.find((s: Song) => s.id === songId);
      if (foundSong) {
        setSong(foundSong);
      }
    }
  }, [songId, user]);
  
  useEffect(() => {
    return () => {
      queryClient.cancelQueries(['song', songId]);
    };
  }, [songId, queryClient]);
  
  const handleSaveEdits = async (title: string, artist: string, bpm: string, lines: { isChordLine: boolean, content: string, tag?: string }[]) => {
    if (!song) return;
    
    const updatedSong = {
      ...song,
      title,
      artist,
      bpm,
      content: lines.map(l => l.content).join('\n'),
      lines
    };
    
    if (user && !songId?.startsWith('song-')) {
      // Save to Supabase
      updateMutation.mutate({
        id: song.id,
        updates: updatedSong
      });
    } else {
      // Save to localStorage
      const songs = JSON.parse(localStorage.getItem("songs") || "[]");
      const updatedSongs = songs.map((s: Song) => s.id === song.id ? updatedSong : s);
      localStorage.setItem("songs", JSON.stringify(updatedSongs));
      
      toast.success("Modifiche salvate localmente");
      navigate(`/view/${song.id}`);
    }
  };
  
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
          <Button>Go Back Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Song</h1>
            <div className="flex space-x-2">
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                type="submit"
                form="song-editor-form" // Assumes SongEditor has a form with this ID
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'SAVE'}
              </Button>
              <Link to={`/view/${songId}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </div>
          
          <SongEditor
            title={song.title}
            artist={song.artist}
            bpm={song.bpm}
            content={song.content}
            onSave={handleSaveEdits}
          />
        </div>
      </main>
    </div>
  );
};

export default EditSong;
